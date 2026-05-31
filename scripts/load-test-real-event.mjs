/**
 * Real-event load test: 5,000 registrations against Home Free NY.
 *
 * All test data is tagged with a unique batch ID so it can be
 * completely reverted with a single cleanup command.
 *
 * Usage:
 *   node scripts/load-test-real-event.mjs
 *   node scripts/load-test-real-event.mjs --registrations 5000 --checkins 2500 --concurrency 10
 *   node scripts/load-test-real-event.mjs --keep   (skip cleanup)
 *
 * REVERT (delete all test data after):
 *   node scripts/load-test-real-event.mjs --cleanup-only
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REGISTRATIONS = parseInt(process.argv.find(a => a.startsWith('--registrations='))?.split('=')[1]) || 5000;
const CHECKINS = parseInt(process.argv.find(a => a.startsWith('--checkins='))?.split('=')[1]) || 2500;
const CONCURRENCY = parseInt(process.argv.find(a => a.startsWith('--concurrency='))?.split('=')[1]) || 10;
const KEEP_DATA = process.argv.includes('--keep');
const CLEANUP_ONLY = process.argv.includes('--cleanup-only');

// The real event
const EVENT_ID = '69e0043632042a9df05641a5';
const EVENT_TITLE = 'Home Free Global Crusade - New York 2026';
const WALK_IN_CODE = 'WI-TEST01';

// Unique batch tag — used to identify ALL test data for cleanup
const BATCH_ID = `loadtest-${Date.now()}`;

// Load env
for (const line of readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8').split('\n')) {
  if (line.startsWith('#') || !line.includes('=')) continue;
  const [key, ...v] = line.split('=');
  const val = v.join('=').trim().replace(/^["']|["']$/g, '');
  if (key && val) process.env[key.trim()] = val;
}

const p = (a, pct) => a[Math.floor(a.length * pct)];
const fmt = ms => ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms/1000).toFixed(2)}s`;
const fmtNum = n => n.toLocaleString();

// ============================================================
// CLEANUP-ONLY MODE
// ============================================================
if (CLEANUP_ONLY) {
  console.log('🧹 Cleanup mode — finding and deleting all load test data...\n');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  // Find all load test registrations (tagged with sourceType starting with "loadtest-")
  const testRegs = await db.collection('event-registrations').find({
    event: new mongoose.Types.ObjectId(EVENT_ID),
    sourceType: { $regex: /^loadtest-/ },
  }).project({ _id: 1, guest: 1, inviteCode: 1 }).toArray();

  console.log(`Found ${testRegs.length} test registrations to delete`);

  if (testRegs.length > 0) {
    const regIds = testRegs.map(r => r._id);
    const guestIds = testRegs.map(r => r.guest).filter(Boolean);

    // Delete registrations
    const rResult = await db.collection('event-registrations').deleteMany({
      _id: { $in: regIds },
    });
    console.log(`   Deleted ${rResult.deletedCount} registrations`);

    // Delete associated guest users
    if (guestIds.length > 0) {
      const gResult = await db.collection('users').deleteMany({
        _id: { $in: guestIds },
        role: 'guest',
      });
      console.log(`   Deleted ${gResult.deletedCount} guest users`);
    }

    // Also delete by email pattern (in case guest IDs didn't match)
    const emailResult = await db.collection('users').deleteMany({
      email: { $regex: /^guest-lt-/ },
      role: 'guest',
    });
    console.log(`   Deleted ${emailResult.deletedCount} additional guest users (by email pattern)`);
  }

  // Clean up any test admin users
  const adminResult = await db.collection('users').deleteMany({
    email: { $regex: /^loadtest-.*@test\.pmcc4thwatch\.us$/ },
  });
  console.log(`   Deleted ${adminResult.deletedCount} test admin users`);

  // Also clean up by notes field (belt-and-suspenders)
  const notesResult = await db.collection('event-registrations').deleteMany({
    event: new mongoose.Types.ObjectId(EVENT_ID),
    notes: { $regex: /^LOADTEST BATCH/ },
  });
  if (notesResult.deletedCount > 0) {
    console.log(`   Deleted ${notesResult.deletedCount} additional registrations (by notes tag)`);
  }

  // Show final count
  const finalCount = await db.collection('event-registrations').countDocuments({
    event: new mongoose.Types.ObjectId(EVENT_ID),
  });
  console.log(`\n📊 Event registrations after cleanup: ${finalCount.toLocaleString()}`);

  await mongoose.disconnect();
  console.log('✅ Cleanup complete');
  process.exit(0);
}

// ============================================================
// MAIN TEST
// ============================================================
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   Home Free NY — Real Event Load Test (5,000)   ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  Event:          ${EVENT_TITLE}`);
  console.log(`  Event ID:       ${EVENT_ID}`);
  console.log(`  Batch ID:       ${BATCH_ID}`);
  console.log(`  Registrations:  ${REGISTRATIONS}`);
  console.log(`  Check-ins:      ${CHECKINS}`);
  console.log(`  Concurrency:    ${CONCURRENCY}`);
  console.log(`  Cleanup:        ${KEEP_DATA ? 'NO (--keep)' : 'YES (auto)'}`);
  console.log('════════════════════════════════════════════════════\n');

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  // Check initial state
  const initialCount = await db.collection('event-registrations').countDocuments({
    event: new mongoose.Types.ObjectId(EVENT_ID),
  });
  const initialTotal = await db.collection('event-registrations').countDocuments({});
  console.log(`📊 Event has ${initialCount.toLocaleString()} registrations (total DB: ${initialTotal.toLocaleString()})\n`);

  // --- Create test admin ---
  const adminEmail = `${BATCH_ID}@test.pmcc4thwatch.us`;
  console.log('📋 Setting up test admin...');
  const createUserRes = await fetch(`${BASE_URL}/payload-api/users`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Load Test ${BATCH_ID}`,
      email: adminEmail,
      password: 'LoadTest123!',
      role: 'superAdmin',
      status: 'approved',
    }),
  });

  if (!createUserRes.ok) {
    const errText = await createUserRes.text();
    console.error(`❌ Failed to create admin (${createUserRes.status}): ${errText}`);
    await mongoose.disconnect();
    return;
  }
  console.log(`   Admin: ${adminEmail}`);

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
  // PHASE 1: WALK-IN REGISTRATIONS
  // ============================================================
  console.log(`\n📝 PHASE 1: ${fmtNum(REGISTRATIONS)} walk-in registrations...`);
  console.log(`   (Each tagged with batch ID: ${BATCH_ID})\n`);

  const regLat = []; let regErr = 0; const regErrMsgs = {};
  const regCodes = [];
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
              walkInCode: WALK_IN_CODE,
              eventId: EVENT_ID,
              // Use platformCode for 1000/hr rate limit bucket (unique per run)
              platformCode: BATCH_ID,
              firstName: 'LT', lastName: String(idx).padStart(5, '0'),
              phone: `+1555${String(2000000 + idx)}`,
              sendNotification: false,
              // Tag with batch ID for cleanup
              notes: `LOADTEST BATCH ${BATCH_ID}`,
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
    const elapsed = (Date.now() - t1) / 1000;
    const rate = done / elapsed;
    const eta = ((REGISTRATIONS - done) / rate);
    process.stdout.write(`\r   ${done}/${REGISTRATIONS} | ${rate.toFixed(0)}/sec | ${regErr} err | ${fmt(Date.now()-t1)} | ETA ${fmt(eta*1000)}      `);
  }

  regLat.sort((a, b) => a - b);
  const regTime = Date.now() - t1;
  console.log(`\n\n   ✅ ${regCodes.length}/${fmtNum(REGISTRATIONS)} in ${fmt(regTime)} (${(regCodes.length/(regTime/1000)).toFixed(0)} ops/sec)`);
  if (regLat.length) console.log(`   p50=${fmt(p(regLat,.5))} p90=${fmt(p(regLat,.9))} p95=${fmt(p(regLat,.95))} p99=${fmt(p(regLat,.99))}`);
  if (regErr > 0) console.log('   Errors:', JSON.stringify(regErrMsgs));

  // Tag all test registrations in DB with batch ID in sourceType
  console.log('\n   🏷️  Tagging registrations for cleanup...');
  const tagResult = await db.collection('event-registrations').updateMany(
    { event: new mongoose.Types.ObjectId(EVENT_ID), notes: `LOADTEST BATCH ${BATCH_ID}` },
    { $set: { sourceType: BATCH_ID } }
  );
  console.log(`   Tagged ${tagResult.modifiedCount} registrations with sourceType="${BATCH_ID}"`);

  // Show mid-test count
  const midCount = await db.collection('event-registrations').countDocuments({
    event: new mongoose.Types.ObjectId(EVENT_ID),
  });
  console.log(`\n📊 Event registrations: ${initialCount.toLocaleString()} → ${midCount.toLocaleString()} (+${(midCount - initialCount).toLocaleString()})`);

  // ============================================================
  // PHASE 2: CHECK-INS
  // ============================================================
  const actualCheckins = Math.min(CHECKINS, regCodes.length);
  let ciSuccess = 0, ciTime = 0;
  let ciLat = [];

  console.log(`\n\n🔍 PHASE 2: ${fmtNum(actualCheckins)} check-ins via QR scan...`);

  if (actualCheckins === 0) {
    console.log('   ⚠️  No registrations to check in. Skipping.');
  } else {
    const codesToCheckin = regCodes.slice(0, actualCheckins);

    // Reset to "registered" status (simulates online guests)
    console.log('   Resetting status to "registered"...');
    const resetResult = await db.collection('event-registrations').updateMany(
      { inviteCode: { $in: codesToCheckin } },
      { $set: { status: 'registered' }, $unset: { attendedAt: '', checkedInBy: '' } }
    );
    console.log(`   Reset ${resetResult.modifiedCount} registrations`);
    console.log('   Scanning QR codes...\n');

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
              body: JSON.stringify({ registrationCode: code, eventId: EVENT_ID }),
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
      const elapsed = (Date.now() - t2) / 1000;
      const rate = done / elapsed;
      const eta = ((actualCheckins - done) / rate);
      process.stdout.write(`\r   ${done}/${actualCheckins} | ${ciSuccess} checked in | ${ciErr} err | ${fmt(Date.now()-t2)} | ETA ${fmt(eta*1000)}      `);
    }

    ciLat.sort((a, b) => a - b);
    ciTime = Date.now() - t2;
    console.log(`\n\n   ✅ ${ciSuccess}/${fmtNum(actualCheckins)} checked in (${ciErr} errors) in ${fmt(ciTime)}`);
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
    const res = await fetch(`${BASE_URL}/api/events/${EVENT_ID}/stats`, { headers: hdrs });
    const d = await res.json();
    sLat.push(Date.now() - t0);
    if (i === 19) {
      console.log(`   Final stats:`);
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
  const finalEventCount = await db.collection('event-registrations').countDocuments({
    event: new mongoose.Types.ObjectId(EVENT_ID),
  });
  const finalTotal = await db.collection('event-registrations').countDocuments({});
  const delta = finalEventCount - initialCount;

  console.log(`\n📊 Event registrations: ${initialCount.toLocaleString()} → ${finalEventCount.toLocaleString()} (+${delta.toLocaleString()})`);
  console.log(`📊 Total DB registrations: ${initialTotal.toLocaleString()} → ${finalTotal.toLocaleString()}`);

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║                    SUMMARY                       ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  Walk-in regs:    ${regCodes.length}/${fmtNum(REGISTRATIONS)} in ${fmt(regTime)}`);
  console.log(`  Check-ins:       ${ciSuccess}/${fmtNum(actualCheckins)} in ${ciTime ? fmt(ciTime) : 'N/A'}`);
  console.log(`  Event count:     ${initialCount.toLocaleString()} → ${finalEventCount.toLocaleString()} (+${delta.toLocaleString()})`);
  console.log(`  Batch tag:       ${BATCH_ID}`);

  if (regCodes.length > 0) {
    const rate = regCodes.length / (regTime / 1000);
    console.log(`\n  📈 Performance:`);
    console.log(`     Reg throughput:  ${rate.toFixed(0)} ops/sec`);
    console.log(`     Total time:      ${fmt(regTime)}`);
    console.log(`     Checkin p50:     ${ciLat.length ? fmt(p(ciLat,.5)) : 'N/A'}`);
    console.log(`     Stats p50:       ${sLat.length ? fmt(p(sLat,.5)) : 'N/A'}`);
  }

  // ============================================================
  // CLEANUP
  // ============================================================
  if (KEEP_DATA) {
    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log('║           REVERT INSTRUCTIONS                   ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log(`\n  Test data is still in the DB. To delete ALL test data, run:`);
    console.log(`\n    node scripts/load-test-real-event.mjs --cleanup-only\n`);
    console.log(`  This will delete:`);
    console.log(`    - ${delta} test registrations`);
    console.log(`    - All guest users created by this test`);
    console.log(`    - The test admin user (${adminEmail})`);
    console.log(`\n  Batch ID: ${BATCH_ID}`);
    await mongoose.disconnect();
  } else {
    console.log('\n🧹 Auto-cleanup — deleting test data...');
    const t0 = Date.now();

    // Find test registrations
    const testRegs = await db.collection('event-registrations').find({
      sourceType: BATCH_ID,
    }).project({ _id: 1, guest: 1 }).toArray();

    if (testRegs.length > 0) {
      const regIds = testRegs.map(r => r._id);
      const guestIds = testRegs.map(r => r.guest).filter(Boolean);

      const rDel = await db.collection('event-registrations').deleteMany({ _id: { $in: regIds } });
      console.log(`   Deleted ${rDel.deletedCount} registrations`);

      if (guestIds.length > 0) {
        const gDel = await db.collection('users').deleteMany({ _id: { $in: guestIds }, role: 'guest' });
        console.log(`   Deleted ${gDel.deletedCount} guest users`);
      }
    }

    // Clean up test admin
    await db.collection('users').deleteOne({ email: adminEmail });
    console.log(`   Deleted test admin`);

    // Also clean by notes tag (belt-and-suspenders)
    const notesDel = await db.collection('event-registrations').deleteMany({
      event: new mongoose.Types.ObjectId(EVENT_ID),
      notes: `LOADTEST BATCH ${BATCH_ID}`,
    });
    if (notesDel.deletedCount > 0) console.log(`   Deleted ${notesDel.deletedCount} additional (by notes)`);

    // Also clean by email pattern
    const emailDel = await db.collection('users').deleteMany({
      email: { $regex: /^guest-lt-/ },
      role: 'guest',
    });
    if (emailDel.deletedCount > 0) console.log(`   Deleted ${emailDel.deletedCount} guest users (by email)`);

    const afterCount = await db.collection('event-registrations').countDocuments({
      event: new mongoose.Types.ObjectId(EVENT_ID),
    });
    console.log(`\n   Event registrations: ${finalEventCount.toLocaleString()} → ${afterCount.toLocaleString()} in ${Date.now()-t0}ms`);
    await mongoose.disconnect();
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
