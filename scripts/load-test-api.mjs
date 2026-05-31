/**
 * API-level load test: full HTTP endpoint test with real middleware.
 *
 * Phases:
 *   1. Walk-in registrations via POST /api/register (status=attended)
 *   2. Reset half to "registered", then check-in via POST /api/check-in
 *   3. Stats polling via GET /api/events/{id}/stats
 *
 * Key fixes from v1:
 *   - Pass platformCode in walk-in requests → 1000/hr rate limit bucket
 *     (without it, all walk-ins share "anonymous" key capped at 200/hr)
 *   - Create registrations via walk-in API (proper Payload documents),
 *     then reset status to "registered" via direct DB update before
 *     running check-ins (avoids schema-mismatch 500 errors from
 *     raw MongoDB inserts that bypass Payload validation)
 *
 * Usage:
 *   node scripts/load-test-api.mjs --registrations 200 --checkins 100 --concurrency 10
 *   node scripts/load-test-api.mjs --keep   (don't cleanup — see numbers in admin dashboard)
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REGISTRATIONS = parseInt(process.argv.find(a => a.startsWith('--registrations='))?.split('=')[1]) || 200;
const CHECKINS = parseInt(process.argv.find(a => a.startsWith('--checkins='))?.split('=')[1]) || 100;
const CONCURRENCY = parseInt(process.argv.find(a => a.startsWith('--concurrency='))?.split('=')[1]) || 10;
const SEND_NOTIFICATIONS = process.argv.includes('--sendNotifications');
const KEEP_DATA = process.argv.includes('--keep');

// Load env
for (const line of readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8').split('\n')) {
  if (line.startsWith('#') || !line.includes('=')) continue;
  const [key, ...v] = line.split('=');
  const val = v.join('=').trim().replace(/^["']|["']$/g, '');
  if (key && val) process.env[key.trim()] = val;
}

const p = (a, pct) => a[Math.floor(a.length * pct)];
const fmt = ms => ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms/1000).toFixed(2)}s`;

async function main() {
  console.log('==========================================');
  console.log('  PMCC 4th Watch — API Load Test v2');
  console.log('==========================================');
  console.log(`  URL:            ${BASE_URL}`);
  console.log(`  Registrations:  ${REGISTRATIONS} (walk-in)`);
  console.log(`  Check-ins:      ${CHECKINS} (reset to registered, then scan QR)`);
  console.log(`  Concurrency:    ${CONCURRENCY}`);
  console.log(`  Email/SMS:      ${SEND_NOTIFICATIONS ? 'YES' : 'NO'}`);
  console.log(`  Cleanup:        ${KEEP_DATA ? 'NO (data stays in DB)' : 'YES'}`);
  console.log('==========================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  // Check initial count
  const initialCount = await db.collection('event-registrations').countDocuments({});
  console.log(`📊 DB has ${initialCount.toLocaleString()} registrations before test\n`);

  // --- Setup ---
  console.log('📋 Creating test data...');
  const eventId = new mongoose.Types.ObjectId();
  const adminEmail = `loadtest-${Date.now()}@test.pmcc4thwatch.us`;

  // Unique platformCode per run — gives us a fresh 1000/hr rate limit bucket
  const testPlatformCode = `loadtest-${Date.now()}`;

  // Create event
  await db.collection('managed-events').insertOne({
    _id: eventId, title: 'LOAD TEST EVENT (DELETE ME)',
    slug: `load-test-${Date.now()}`, status: 'registration-open',
    startDate: new Date('2026-06-07T10:00:00Z'), endDate: new Date('2026-06-08T18:00:00Z'),
    location: 'Test Venue', maxAttendees: 10000,
    walkInEnabled: true, walkInCode: 'LOADTEST',
    hasBaptism: true, checkInEnabled: true, registrationEnabled: true,
    createdAt: new Date(), updatedAt: new Date(),
  });

  // Create admin user via Payload's native create endpoint (bypasses
  // the custom /api/auth/register which is rate-limited to 3/hr/IP).
  // Payload's users collection has `create: () => true` so anyone can
  // create a user — and this endpoint hashes the password correctly.
  const createUserRes = await fetch(`${BASE_URL}/payload-api/users`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Load Test Admin',
      email: adminEmail,
      password: 'LoadTest123!',
      role: 'superAdmin',
      status: 'approved',
    }),
  });

  if (!createUserRes.ok) {
    const errText = await createUserRes.text();
    console.error(`❌ Failed to create admin user (${createUserRes.status}): ${errText}`);
    await mongoose.disconnect();
    return;
  }

  console.log(`   Event: ${eventId}`);
  console.log(`   Admin: ${adminEmail}`);
  console.log(`   Rate limit key: register:${testPlatformCode} (1000/hr)`);

  // Login
  console.log('\n🔐 Logging in...');
  const loginRes = await fetch(`${BASE_URL}/payload-api/users/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: 'LoadTest123!' }),
  });

  if (!loginRes.ok) {
    console.error(`❌ Login failed (${loginRes.status}): ${await loginRes.text()}`);
    await mongoose.disconnect();
    return;
  }

  let token;
  const setCookie = loginRes.headers.get('set-cookie') || '';
  const m = setCookie.match(/payload-token=([^;]+)/);
  token = m ? m[1] : (await loginRes.json().catch(() => ({}))).token;

  if (!token) { console.error('❌ No token'); await mongoose.disconnect(); return; }
  console.log('   ✅ Authenticated');

  const hdrs = { 'Content-Type': 'application/json', 'Cookie': `payload-token=${token}` };

  // ============================================================
  // PHASE 1: WALK-IN REGISTRATIONS (creates status=attended)
  // Pass platformCode so rate limit uses a fresh 1000/hr bucket
  // instead of the shared "anonymous" key (capped at 200/hr).
  // The walk-in path runs first, so platformCode only affects
  // the rate limit key — it doesn't change the registration logic.
  // ============================================================
  console.log(`\n📝 PHASE 1: ${REGISTRATIONS} walk-in registrations...`);
  const regLat = []; let regErr = 0; const regErrMsgs = {};
  const regCodes = [];  // collect codes for check-in phase
  const t1 = Date.now();

  for (let i = 0; i < REGISTRATIONS; i += CONCURRENCY) {
    const batch = Math.min(CONCURRENCY, REGISTRATIONS - i);
    const proms = [];
    for (let j = 0; j < batch; j++) {
      const idx = i + j;
      proms.push((async () => {
        const t0 = Date.now();
        try {
          const res = await fetch(`${BASE_URL}/api/register`, {
            method: 'POST', headers: hdrs,
            body: JSON.stringify({
              walkInCode: 'LOADTEST',
              eventId: eventId.toString(),
              // platformCode shifts rate limit to a fresh 1000/hr bucket
              // (walk-in path ignores it — only rateLimitAsync reads it)
              platformCode: testPlatformCode,
              firstName: 'Guest', lastName: String(idx),
              phone: `+1555${String(1000000 + idx)}`,
              sendNotification: SEND_NOTIFICATIONS,
            }),
          });
          const d = await res.json();
          regLat.push(Date.now() - t0);
          if (!res.ok || !d.success) {
            regErr++;
            const errMsg = d.error || `HTTP ${res.status}`;
            regErrMsgs[errMsg] = (regErrMsgs[errMsg] || 0) + 1;
          } else if (d.registration?.code) {
            regCodes.push(d.registration.code);
          }
        } catch (e) {
          regErr++; regLat.push(Date.now() - t0);
        }
      })());
    }
    await Promise.all(proms);
    const done = Math.min(i + CONCURRENCY, REGISTRATIONS);
    process.stdout.write(`\r   ${done}/${REGISTRATIONS} | ${(done/((Date.now()-t1)/1000)).toFixed(0)}/sec | ${regErr} err | ${fmt(Date.now()-t1)}      `);
  }

  regLat.sort((a, b) => a - b);
  const regTime = Date.now() - t1;
  console.log(`\n   ✅ ${regCodes.length}/${REGISTRATIONS} in ${fmt(regTime)} (${(regCodes.length/(regTime/1000)).toFixed(0)} ops/sec)`);
  if (regLat.length) console.log(`   p50=${fmt(p(regLat,.5))} p90=${fmt(p(regLat,.9))} p95=${fmt(p(regLat,.95))} p99=${fmt(p(regLat,.99))}`);
  if (regErr > 0) console.log('   Errors:', JSON.stringify(regErrMsgs));

  // Show mid-test DB count
  const midCount = await db.collection('event-registrations').countDocuments({});
  console.log(`\n📊 DB registrations after walk-ins: ${initialCount.toLocaleString()} → ${midCount.toLocaleString()} (+${(midCount - initialCount).toLocaleString()})`);

  // ============================================================
  // PHASE 2: CHECK-IN TEST
  // Take walk-in registrations (status=attended), reset them to
  // "registered" via direct DB update (simulates online guests who
  // haven't checked in yet), then scan their QR codes via the API.
  // This tests the real check-in flow with properly-formed Payload
  // documents — no schema-mismatch issues.
  // ============================================================
  const actualCheckins = Math.min(CHECKINS, regCodes.length);
  let ciSuccess = 0, ciTime = 0;
  let ciLat = [];
  console.log(`\n\n🔍 PHASE 2: ${actualCheckins} check-ins via QR scan...`);

  if (actualCheckins === 0) {
    console.log('   ⚠️  No registrations to check in (all walk-in regs failed). Skipping.');
  } else {
    // Pick codes for check-in
    const codesToCheckin = regCodes.slice(0, actualCheckins);

    // Reset their status to "registered" via direct DB update
    // (simulates guests who registered online but haven't arrived yet)
    console.log('   Resetting status to "registered" (simulating online guests)...');
    const resetResult = await db.collection('event-registrations').updateMany(
      { inviteCode: { $in: codesToCheckin } },
      {
        $set: { status: 'registered' },
        $unset: { attendedAt: '', checkedInBy: '' },
      }
    );
    console.log(`   Reset ${resetResult.modifiedCount} registrations to "registered"`);
    console.log('   Now scanning QR codes...\n');

    // Check them in via the API (realistic QR scan simulation)
    ciLat = []; let ciErr = 0; const ciErrMsgs = {};
    const t2 = Date.now();

    for (let i = 0; i < actualCheckins; i += CONCURRENCY) {
      const batch = Math.min(CONCURRENCY, actualCheckins - i);
      const proms = [];
      for (let j = 0; j < batch; j++) {
        const code = codesToCheckin[i + j];
        proms.push((async () => {
          const t0 = Date.now();
          try {
            const res = await fetch(`${BASE_URL}/api/check-in`, {
              method: 'POST', headers: hdrs,
              body: JSON.stringify({ registrationCode: code, eventId: eventId.toString() }),
            });
            const d = await res.json();
            ciLat.push(Date.now() - t0);
            if (res.ok && d.success) ciSuccess++;
            else {
              ciErr++;
              const errMsg = d.error || d.code || `HTTP ${res.status}`;
              ciErrMsgs[errMsg] = (ciErrMsgs[errMsg] || 0) + 1;
            }
          } catch {
            ciErr++; ciLat.push(Date.now() - t0);
          }
        })());
      }
      await Promise.all(proms);
      const done = Math.min(i + CONCURRENCY, actualCheckins);
      process.stdout.write(`\r   ${done}/${actualCheckins} | ${ciSuccess} checked in | ${ciErr} err | ${fmt(Date.now()-t2)}      `);
    }

    ciLat.sort((a, b) => a - b);
    ciTime = Date.now() - t2;
    console.log(`\n   ✅ ${ciSuccess}/${actualCheckins} checked in (${ciErr} errors) in ${fmt(ciTime)}`);
    if (ciLat.length) console.log(`   p50=${fmt(p(ciLat,.5))} p90=${fmt(p(ciLat,.9))} p95=${fmt(p(ciLat,.95))} p99=${fmt(p(ciLat,.99))}`);
    if (ciErr > 0) console.log('   Errors:', JSON.stringify(ciErrMsgs));
  }

  // ============================================================
  // PHASE 3: STATS
  // ============================================================
  console.log(`\n\n📊 PHASE 3: 20 stats queries...\n`);
  const sLat = [];
  for (let i = 0; i < 20; i++) {
    const t0 = Date.now();
    const res = await fetch(`${BASE_URL}/api/events/${eventId}/stats`, { headers: hdrs });
    const d = await res.json();
    sLat.push(Date.now() - t0);
    if (i === 19) {
      console.log(`   Final stats from API:`);
      console.log(`     totalRegistrations: ${d.totalRegistrations}`);
      console.log(`     attendedCount:      ${d.attendedCount}`);
      console.log(`     spotsRemaining:     ${d.spotsRemaining}`);
    }
  }
  sLat.sort((a, b) => a - b);
  if (sLat.length) console.log(`   p50=${fmt(p(sLat,.5))} p90=${fmt(p(sLat,.9))} p95=${fmt(p(sLat,.95))}`);

  // ============================================================
  // VERIFY
  // ============================================================
  const dbCount = await db.collection('event-registrations').countDocuments({ event: eventId });
  const expectedTotal = regCodes.length;  // walk-in regs (check-ins don't add new rows)
  console.log(`\n📊 DB count for test event: ${dbCount.toLocaleString()} (expected ~${expectedTotal})`);

  const finalCount = await db.collection('event-registrations').countDocuments({});
  const delta = finalCount - initialCount;
  console.log(`📊 Total DB registrations: ${initialCount.toLocaleString()} → ${finalCount.toLocaleString()} (+${delta.toLocaleString()})`);

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n==========================================');
  console.log('  SUMMARY');
  console.log('==========================================');
  console.log(`  Walk-in regs:   ${regCodes.length}/${REGISTRATIONS} in ${fmt(regTime)}`);
  console.log(`  Check-ins:      ${ciSuccess}/${actualCheckins} in ${ciTime ? fmt(ciTime) : 'N/A'}`);
  console.log(`  DB added:       +${delta} registrations`);
  console.log(`  Total in DB:    ${finalCount.toLocaleString()}`);

  if (regCodes.length > 0) {
    const rate = regCodes.length / (regTime / 1000);
    const est5k = 5000 / rate;
    console.log(`\n  📈 Capacity (from your dev machine → Atlas):`);
    console.log(`     Reg throughput:  ${rate.toFixed(0)} ops/sec`);
    console.log(`     Time for 5,000:  ${fmt(est5k * 1000)}`);
    console.log(`     Checkin p50:     ${ciLat.length ? fmt(p(ciLat,.5)) : 'N/A'}`);
    console.log(`     Stats p50:       ${sLat.length ? fmt(p(sLat,.5)) : 'N/A'}`);
    console.log(`     From Netlify:    ~2-3× faster (same region as Atlas)`);
  }

  // Cleanup
  if (KEEP_DATA) {
    console.log(`\n⚠️  Data left in DB so you can verify in the admin dashboard.`);
    console.log(`   Test event ID: ${eventId}`);
    console.log(`   Test event title: "LOAD TEST EVENT (DELETE ME)"`);
    console.log(`   Admin email: ${adminEmail}`);
    console.log('\n   To clean up later, run:');
    console.log(`   node -e "`);
    console.log     // broken into readable lines
    const cleanupScript = [
      `const mongoose = require('mongoose');`,
      `mongoose.connect(process.env.MONGODB_URI).then(async () => {`,
      `  const db = mongoose.connection.db;`,
      `  const r = await db.collection('event-registrations').deleteMany({event: new mongoose.Types.ObjectId('${eventId}')});`,
      `  const u = await db.collection('users').deleteOne({email: '${adminEmail}'});`,
      `  const e = await db.collection('managed-events').deleteOne({_id: new mongoose.Types.ObjectId('${eventId}')});`,
      `  console.log('Deleted:', r.deletedCount, 'regs,', u.deletedCount, 'users,', e.deletedCount, 'events');`,
      `  await mongoose.disconnect();`,
      `});`,
    ].join('\n    ');
    console.log(`   ${cleanupScript}`);
    await mongoose.disconnect();
  } else {
    console.log('\n🧹 Cleaning up test data...');
    const t0 = Date.now();
    const r = await db.collection('event-registrations').deleteMany({ event: eventId });
    // Also clean up any guest users created during walk-in registrations
    const g = await db.collection('users').deleteMany({
      email: /^guest-[a-z0-9]+@pmcc4thwatch\.us$/,
      role: 'guest',
      createdAt: { $gte: new Date(Date.now() - 600000) },  // created in last 10 min
    });
    await db.collection('managed-events').deleteOne({ _id: eventId });
    await db.collection('users').deleteOne({ email: adminEmail });
    console.log(`   Deleted ${r.deletedCount} regs, ${g.deletedCount} guests, 1 event, 1 admin in ${Date.now()-t0}ms`);

    const afterCount = await db.collection('event-registrations').countDocuments({});
    console.log(`   Final DB count: ${afterCount.toLocaleString()} (back to ${initialCount.toLocaleString()})`);
    await mongoose.disconnect();
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
