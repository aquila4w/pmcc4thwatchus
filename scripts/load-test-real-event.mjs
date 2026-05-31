/**
 * Real-event load test: concurrent registrations + check-ins + stats.
 *
 * Simulates a real event day:
 *   - Registration booth processing walk-ins
 *   - Check-in station scanning QR codes from pre-registered guests
 *   - Admin dashboard polling stats
 * All three streams run SIMULTANEOUSLY.
 *
 * All test data is tagged with a unique batch ID for full revert.
 *
 * Usage:
 *   node scripts/load-test-real-event.mjs                         (defaults: 5000 reg, 2500 checkin)
 *   node scripts/load-test-real-event.mjs --registrations=5000 --checkins=2500 --concurrency=50
 *   node scripts/load-test-real-event.mjs --keep                   (skip cleanup)
 *   node scripts/load-test-real-event.mjs --prod                   (hit production URL)
 *   node scripts/load-test-real-event.mjs --cleanup-only           (revert all test data)
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.argv.includes('--prod') ? 'https://pmcc4thwatch.us' : (process.env.BASE_URL || 'http://localhost:3000');
const REGISTRATIONS = parseInt(process.argv.find(a => a.startsWith('--registrations='))?.split('=')[1]) || 5000;
const CHECKINS = parseInt(process.argv.find(a => a.startsWith('--checkins='))?.split('=')[1]) || 2500;
const CONCURRENCY = parseInt(process.argv.find(a => a.startsWith('--concurrency='))?.split('=')[1]) || 50;
const STATS_INTERVAL = parseInt(process.argv.find(a => a.startsWith('--stats-interval='))?.split('=')[1]) || 5000;
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
  const eventObjId = new mongoose.Types.ObjectId(EVENT_ID);

  const preCount = await db.collection('event-registrations').countDocuments({ event: eventObjId });
  console.log(`📊 Event has ${preCount.toLocaleString()} registrations before cleanup\n`);

  // 1. Find by sourceType (tagged registrations)
  const taggedRegs = await db.collection('event-registrations').find({
    event: eventObjId,
    sourceType: { $regex: /^loadtest-/ },
  }).project({ _id: 1, guest: 1 }).toArray();

  // 2. Find by notes (catches untagged if script crashed before tagging)
  const notedRegs = await db.collection('event-registrations').find({
    event: eventObjId,
    notes: { $regex: /^LOADTEST BATCH/ },
  }).project({ _id: 1, guest: 1 }).toArray();

  // Merge and deduplicate
  const allIds = new Map();
  const allGuestIds = new Map();
  for (const r of [...taggedRegs, ...notedRegs]) {
    allIds.set(r._id.toString(), r._id);
    if (r.guest) allGuestIds.set(r.guest.toString(), r.guest);
  }

  console.log(`Found ${taggedRegs.length} by sourceType + ${notedRegs.length} by notes (${allIds.size} unique)`);

  if (allIds.size > 0) {
    const regArr = [...allIds.values()];
    let totalDeleted = 0;
    for (let i = 0; i < regArr.length; i += 5000) {
      const chunk = regArr.slice(i, i + 5000);
      const r = await db.collection('event-registrations').deleteMany({ _id: { $in: chunk } });
      totalDeleted += r.deletedCount;
    }
    console.log(`✅ Deleted ${totalDeleted} registrations`);

    if (allGuestIds.size > 0) {
      const guestArr = [...allGuestIds.values()];
      let totalGuestsDeleted = 0;
      for (let i = 0; i < guestArr.length; i += 5000) {
        const chunk = guestArr.slice(i, i + 5000);
        const g = await db.collection('users').deleteMany({ _id: { $in: chunk }, role: 'guest' });
        totalGuestsDeleted += g.deletedCount;
      }
      console.log(`✅ Deleted ${totalGuestsDeleted} guest users`);
    }
  }

  // 3. Orphan guest users by email patterns
  const emailPatterns = [
    /^guest-lt-/,
    /^guest-[a-z0-9]{8}@pmcc4thwatch\.us$/,
  ];
  for (const pat of emailPatterns) {
    const g = await db.collection('users').deleteMany({ email: pat, role: 'guest' });
    if (g.deletedCount > 0) console.log(`✅ Deleted ${g.deletedCount} orphan guests (${pat.toString().slice(1,-1)})`);
  }

  // 4. Test admin users
  const adminResult = await db.collection('users').deleteMany({
    email: { $regex: /^loadtest-.*@test\.pmcc4thwatch\.us$/ },
  });
  if (adminResult.deletedCount > 0) console.log(`✅ Deleted ${adminResult.deletedCount} test admin users`);

  // 5. Final verification
  const finalCount = await db.collection('event-registrations').countDocuments({ event: eventObjId });
  console.log(`\n📊 Event registrations: ${preCount.toLocaleString()} → ${finalCount.toLocaleString()} (-${preCount - finalCount})`);
  console.log('✅ Cleanup complete');

  await mongoose.disconnect();
  process.exit(0);
}

// ============================================================
// MAIN TEST — Concurrent registration + check-in + stats
// ============================================================
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   Home Free NY — Concurrent Load Test (Simultaneous)    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Target:         ${BASE_URL}`);
  console.log(`  Event:          ${EVENT_TITLE}`);
  console.log(`  Event ID:       ${EVENT_ID}`);
  console.log(`  Batch ID:       ${BATCH_ID}`);
  console.log(`  Registrations:  ${fmtNum(REGISTRATIONS)} (walk-in booth)`);
  console.log(`  Check-ins:      ${fmtNum(CHECKINS)} (QR scan station)`);
  console.log(`  Stats polling:  every ${fmt(STATS_INTERVAL)}`);
  console.log(`  Concurrency:    ${CONCURRENCY} per stream`);
  console.log(`  Cleanup:        ${KEEP_DATA ? 'NO (--keep)' : 'YES (auto)'}`);
  console.log('════════════════════════════════════════════════════════════\n');

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const eventObjId = new mongoose.Types.ObjectId(EVENT_ID);

  // Check initial state
  const initialCount = await db.collection('event-registrations').countDocuments({ event: eventObjId });
  const initialTotal = await db.collection('event-registrations').countDocuments({});
  console.log(`📊 Event has ${initialCount.toLocaleString()} registrations (total DB: ${initialTotal.toLocaleString()})\n`);

  // --- Pre-seed: Create "registered" guests for check-in stream ---
  // We create these directly in DB so the check-in station has guests to scan
  // from the very start (simulates pre-registered online guests).
  console.log(`📋 Pre-seeding ${fmtNum(CHECKINS)} online registrations for check-in stream...`);
  const preSeedCodes = [];
  const preSeedIds = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < CHECKINS; i++) {
    let code = '';
    for (let c = 0; c < 8; c++) code += chars[Math.floor(Math.random() * chars.length)];
    preSeedCodes.push(code);
    preSeedIds.push(new mongoose.Types.ObjectId());
  }

  // Insert pre-seed registrations in batches
  for (let i = 0; i < CHECKINS; i += 1000) {
    const batch = preSeedIds.slice(i, i + 1000).map((id, idx) => {
      const code = preSeedCodes[i + idx];
      return {
        _id: id,
        inviteCode: code,
        event: eventObjId,
        sourceType: BATCH_ID,
        guestInfo: { name: `Pre-reg Guest ${i + idx + 1}` },
        qrCodeData: code,
        status: 'registered',
        notes: `LOADTEST BATCH ${BATCH_ID}`,
        registeredAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
    await db.collection('event-registrations').insertMany(batch);
  }
  console.log(`   ✅ ${fmtNum(CHECKINS)} pre-seeded (status=registered, ready for check-in)`);

  // --- Create test admin ---
  const adminEmail = `${BATCH_ID}@test.pmcc4thwatch.us`;
  console.log('\n📋 Creating test admin...');
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
    console.error(`❌ Failed to create admin (${createUserRes.status}): ${await createUserRes.text()}`);
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
  // CONCURRENT STREAMS
  // ============================================================
  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log('║  STARTING CONCURRENT STREAMS (registration + check-in + stats)  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const testStart = Date.now();

  // --- Stream counters (shared across concurrent streams) ---
  const regStats = { done: 0, success: 0, err: 0, latencies: [], errors: {} };
  const ciStats = { done: 0, success: 0, err: 0, latencies: [], errors: {} };
  const statsResults = { queries: 0, latencies: [], lastData: null };
  const regCodes = [];

  // Progress display interval
  const progressInterval = setInterval(() => {
    const elapsed = (Date.now() - testStart) / 1000;
    const regRate = regStats.done / elapsed || 0;
    const ciRate = ciStats.done / elapsed || 0;
    process.stdout.write(
      `\r   📝 Reg: ${regStats.done}/${fmtNum(REGISTRATIONS)} (${regRate.toFixed(0)}/sec)  |  ` +
      `🔍 Check-in: ${ciStats.done}/${fmtNum(CHECKINS)} (${ciRate.toFixed(0)}/sec)  |  ` +
      `📊 Stats: ${statsResults.queries} queries  |  ${fmt(Date.now() - testStart)}      `
    );
  }, 1000);

  // --- STREAM 1: Walk-in registrations ---
  const registrationStream = (async () => {
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
                platformCode: BATCH_ID,
                firstName: 'LT', lastName: String(idx).padStart(5, '0'),
                phone: `+1555${String(2000000 + idx)}`,
                sendNotification: false,
                notes: `LOADTEST BATCH ${BATCH_ID}`,
              }),
            });
            const d = await res.json();
            regStats.latencies.push(Date.now() - t0);
            if (!res.ok || !d.success) {
              regStats.err++;
              const errMsg = d.error || `HTTP ${res.status}`;
              regStats.errors[errMsg] = (regStats.errors[errMsg] || 0) + 1;
            } else {
              regStats.success++;
              if (d.registration?.code) regCodes.push(d.registration.code);
            }
          } catch {
            regStats.err++;
            regStats.latencies.push(Date.now() - t0);
          }
          regStats.done++;
        })());
      }
      await Promise.all(proms);
    }
  })();

  // --- STREAM 2: Check-in QR scans (against pre-seeded registrations) ---
  const checkinStream = (async () => {
    // Shuffle pre-seed codes to simulate random scan order
    const shuffled = [...preSeedCodes].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffled.length; i += CONCURRENCY) {
      const batch = Math.min(CONCURRENCY, shuffled.length - i);
      const proms = [];
      for (let j = 0; j < batch; j++) {
        const code = shuffled[i + j];
        proms.push((async () => {
          const t0 = Date.now();
          try {
            const res = await fetch(`${BASE_URL}/api/check-in`, {
              method: 'POST', headers: hdrs,
              body: JSON.stringify({ registrationCode: code, eventId: EVENT_ID }),
            });
            const d = await res.json();
            ciStats.latencies.push(Date.now() - t0);
            if (res.ok && d.success) ciStats.success++;
            else {
              ciStats.err++;
              const errMsg = d.error || d.code || `HTTP ${res.status}`;
              ciStats.errors[errMsg] = (ciStats.errors[errMsg] || 0) + 1;
            }
          } catch {
            ciStats.err++;
            ciStats.latencies.push(Date.now() - t0);
          }
          ciStats.done++;
        })());
      }
      await Promise.all(proms);
    }
  })();

  // --- STREAM 3: Stats polling (periodic dashboard queries) ---
  const statsStream = (async () => {
    while (true) {
      const t0 = Date.now();
      try {
        const res = await fetch(`${BASE_URL}/api/events/${EVENT_ID}/stats`, { headers: hdrs });
        const d = await res.json();
        statsResults.latencies.push(Date.now() - t0);
        statsResults.queries++;
        statsResults.lastData = d;
      } catch {
        statsResults.latencies.push(Date.now() - t0);
        statsResults.queries++;
      }
      // Wait for next poll
      await new Promise(r => setTimeout(r, STATS_INTERVAL));
    }
  })();

  // Run registration and check-in concurrently; stats runs until they finish
  await Promise.all([registrationStream, checkinStream]);

  // Stop stats polling and progress display
  clearInterval(progressInterval);

  const totalTime = Date.now() - testStart;

  // Stop stats by letting it naturally end (we can't abort the promise,
  // but since we're past the await, the while(true) will continue harmlessly)

  // ============================================================
  // TAG registrations for cleanup
  // ============================================================
  console.log('\n\n   🏷️  Tagging walk-in registrations for cleanup...');
  const tagResult = await db.collection('event-registrations').updateMany(
    { event: eventObjId, notes: `LOADTEST BATCH ${BATCH_ID}`, sourceType: { $ne: BATCH_ID } },
    { $set: { sourceType: BATCH_ID } }
  );
  console.log(`   Tagged ${tagResult.modifiedCount} additional registrations`);

  // ============================================================
  // RESULTS
  // ============================================================
  regStats.latencies.sort((a, b) => a - b);
  ciStats.latencies.sort((a, b) => a - b);
  statsResults.latencies.sort((a, b) => a - b);

  const finalEventCount = await db.collection('event-registrations').countDocuments({ event: eventObjId });
  const finalTotal = await db.collection('event-registrations').countDocuments({});
  const delta = finalEventCount - initialCount;

  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log('║                       RESULTS                            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Total time:         ${fmt(totalTime)}`);
  console.log();
  console.log(`  📝 Walk-in Regs:    ${regStats.success}/${fmtNum(REGISTRATIONS)} (${regStats.err} errors)`);
  if (regStats.latencies.length) {
    const regRate = regStats.done / (totalTime / 1000);
    console.log(`     Throughput:     ${regRate.toFixed(0)} ops/sec`);
    console.log(`     p50=${fmt(p(regStats.latencies,.5))} p90=${fmt(p(regStats.latencies,.9))} p95=${fmt(p(regStats.latencies,.95))} p99=${fmt(p(regStats.latencies,.99))}`);
  }
  if (Object.keys(regStats.errors).length > 0) console.log('     Errors:', JSON.stringify(regStats.errors));

  console.log();
  console.log(`  🔍 Check-ins:       ${ciStats.success}/${fmtNum(CHECKINS)} (${ciStats.err} errors)`);
  if (ciStats.latencies.length) {
    const ciRate = ciStats.done / (totalTime / 1000);
    console.log(`     Throughput:     ${ciRate.toFixed(0)} ops/sec`);
    console.log(`     p50=${fmt(p(ciStats.latencies,.5))} p90=${fmt(p(ciStats.latencies,.9))} p95=${fmt(p(ciStats.latencies,.95))} p99=${fmt(p(ciStats.latencies,.99))}`);
  }
  if (Object.keys(ciStats.errors).length > 0) console.log('     Errors:', JSON.stringify(ciStats.errors));

  console.log();
  console.log(`  📊 Stats queries:   ${statsResults.queries} polls`);
  if (statsResults.latencies.length) {
    console.log(`     p50=${fmt(p(statsResults.latencies,.5))} p90=${fmt(p(statsResults.latencies,.9))} p95=${fmt(p(statsResults.latencies,.95))}`);
  }
  if (statsResults.lastData) {
    console.log(`     Final: total=${statsResults.lastData.totalRegistrations} attended=${statsResults.lastData.attendedCount} remaining=${statsResults.lastData.spotsRemaining}`);
  }

  console.log();
  console.log(`  📊 Event count:     ${initialCount.toLocaleString()} → ${finalEventCount.toLocaleString()} (+${delta.toLocaleString()})`);
  console.log(`  📊 Total DB:        ${initialTotal.toLocaleString()} → ${finalTotal.toLocaleString()}`);
  console.log(`  Batch tag:          ${BATCH_ID}`);

  // Combined throughput
  const totalOps = regStats.done + ciStats.done;
  console.log(`\n  📈 Combined: ${totalOps} operations in ${fmt(totalTime)} = ${(totalOps / (totalTime / 1000)).toFixed(0)} total ops/sec`);

  // ============================================================
  // CLEANUP
  // ============================================================
  if (KEEP_DATA) {
    console.log(`\n╔══════════════════════════════════════════════════════════╗`);
    console.log('║               REVERT INSTRUCTIONS                        ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`\n  Test data is still in the DB. To delete ALL test data:`);
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

    // Find by sourceType + notes
    const taggedRegs = await db.collection('event-registrations').find({
      event: eventObjId, sourceType: BATCH_ID,
    }).project({ _id: 1, guest: 1 }).toArray();
    const notedRegs = await db.collection('event-registrations').find({
      event: eventObjId, notes: { $regex: /^LOADTEST BATCH/ },
    }).project({ _id: 1, guest: 1 }).toArray();

    const allIds = new Map();
    const allGuestIds = new Map();
    for (const r of [...taggedRegs, ...notedRegs]) {
      allIds.set(r._id.toString(), r._id);
      if (r.guest) allGuestIds.set(r.guest.toString(), r.guest);
    }

    if (allIds.size > 0) {
      const regArr = [...allIds.values()];
      for (let i = 0; i < regArr.length; i += 5000) {
        await db.collection('event-registrations').deleteMany({ _id: { $in: regArr.slice(i, i + 5000) } });
      }
      console.log(`   Deleted ${allIds.size} registrations`);
    }
    if (allGuestIds.size > 0) {
      const guestArr = [...allGuestIds.values()];
      for (let i = 0; i < guestArr.length; i += 5000) {
        await db.collection('users').deleteMany({ _id: { $in: guestArr.slice(i, i + 5000) }, role: 'guest' });
      }
      console.log(`   Deleted ${allGuestIds.size} guest users`);
    }

    // Orphan guest users
    for (const pat of [/^guest-lt-/, /^guest-[a-z0-9]{8}@pmcc4thwatch\.us$/]) {
      const g = await db.collection('users').deleteMany({ email: pat, role: 'guest' });
      if (g.deletedCount > 0) console.log(`   Deleted ${g.deletedCount} orphan guests`);
    }

    // Test admin
    await db.collection('users').deleteOne({ email: adminEmail });
    console.log(`   Deleted test admin`);

    const afterCount = await db.collection('event-registrations').countDocuments({ event: eventObjId });
    console.log(`\n   Event: ${finalEventCount.toLocaleString()} → ${afterCount.toLocaleString()} in ${Date.now()-t0}ms`);
    await mongoose.disconnect();
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
