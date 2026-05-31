/**
 * Load test: simulates 5,000-person event with concurrent registrations + check-ins.
 *
 * Usage: node scripts/load-test.mjs [--registrations 5000] [--checkins 2000] [--concurrency 50]
 *
 * Requires MONGODB_URI env var (reads from .env.local).
 * Creates test data in a test event, cleans up afterwards.
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { randomBytes } from 'crypto';

// --- Config ---
const REGISTRATIONS = parseInt(process.argv.find(a => a.startsWith('--registrations='))?.split('=')[1]) || 5000;
const CHECKINS = parseInt(process.argv.find(a => a.startsWith('--checkins='))?.split('=')[1]) || 2000;
const CONCURRENCY = parseInt(process.argv.find(a => a.startsWith('--concurrency='))?.split('=')[1]) || 50;
const BATCH_SIZE = CONCURRENCY;

// --- Load env ---
const envPath = resolve(import.meta.dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  if (line.startsWith('#') || !line.includes('=')) continue;
  const [key, ...vals] = line.split('=');
  const value = vals.join('=').trim().replace(/^["']|["']$/g, '');
  if (key && value) process.env[key.trim()] = value;
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not found in .env.local');
  process.exit(1);
}

// --- Helpers ---
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = randomBytes(8);
  for (let i = 0; i < 8; i++) code += chars[bytes[i] % chars.length];
  return code;
}

function p50(arr) { return arr[Math.floor(arr.length * 0.5)]; }
function p90(arr) { return arr[Math.floor(arr.length * 0.9)]; }
function p95(arr) { return arr[Math.floor(arr.length * 0.95)]; }
function p99(arr) { return arr[Math.floor(arr.length * 0.99)]; }

function fmtMs(ms) {
  return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

// --- Schemas ---
const EventSchema = new mongoose.Schema({
  title: String, slug: String, status: String, startDate: Date,
  location: String, maxAttendees: Number, walkInEnabled: Boolean,
  walkInCode: String, hasBaptism: Boolean, checkInEnabled: Boolean,
}, { collection: 'managed-events', strict: false });

const RegistrationSchema = new mongoose.Schema({
  inviteCode: String, event: mongoose.Schema.Types.ObjectId,
  sourceType: String, status: String, guestInfo: Object,
  qrCodeUrl: String, qrCodeData: String,
  registeredAt: Date, attendedAt: Date, baptizedAt: Date,
  checkedInBy: mongoose.Schema.Types.ObjectId, registeredBy: mongoose.Schema.Types.ObjectId,
}, { collection: 'event-registrations', strict: false, timestamps: true });

const UserSchema = new mongoose.Schema({
  name: String, email: String, phone: String, role: String, status: String,
}, { collection: 'users', strict: false });

const Event = mongoose.model('Event', EventSchema);
const Registration = mongoose.model('Registration', RegistrationSchema);
const User = mongoose.model('User', UserSchema);

// --- Main ---
async function main() {
  console.log('==========================================');
  console.log('  PMCC 4th Watch — Load Test');
  console.log('==========================================');
  console.log(`  Registrations: ${REGISTRATIONS.toLocaleString()}`);
  console.log(`  Check-ins:     ${CHECKINS.toLocaleString()}`);
  console.log(`  Concurrency:   ${CONCURRENCY}`);
  console.log(`  Total ops:     ${(REGISTRATIONS + CHECKINS).toLocaleString()}`);
  console.log('==========================================\n');

  const connectStart = Date.now();
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log(`✅ Connected to Atlas in ${Date.now() - connectStart}ms\n`);

  const db = mongoose.connection.db;

  // --- Setup: create test event + admin user ---
  console.log('📋 Setting up test data...');
  const testEventId = new mongoose.Types.ObjectId();
  const testAdminId = new mongoose.Types.ObjectId();

  await db.collection('managed-events').insertOne({
    _id: testEventId,
    title: 'LOAD TEST — 5000 People Event (DELETE ME)',
    slug: `load-test-${Date.now()}`,
    status: 'registration-open',
    startDate: new Date('2026-06-07T10:00:00.000Z'),
    location: 'Test Venue',
    maxAttendees: 10000,
    walkInEnabled: true,
    walkInCode: 'LOADTEST',
    hasBaptism: true,
    checkInEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.collection('users').insertOne({
    _id: testAdminId,
    name: 'Load Test Admin',
    email: `loadtest-${Date.now()}@test.pmcc4thwatch.us`,
    role: 'superAdmin',
    status: 'approved',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`   Test event: ${testEventId}`);
  console.log(`   Test admin: ${testAdminId}\n`);

  // Track created IDs for cleanup
  const createdRegIds = [];
  const createdUserIds = [];
  let regErrors = 0;
  let checkinErrors = 0;
  let regLatencies = [];
  let checkinLatencies = [];

  try {
    // ============================================================
    // PHASE 1: REGISTRATIONS (simulates walk-in booth)
    // ============================================================
    console.log(`\n📝 PHASE 1: ${REGISTRATIONS.toLocaleString()} registrations at ${CONCURRENCY} concurrency...\n`);
    const regStart = Date.now();

    // Process in batches
    for (let i = 0; i < REGISTRATIONS; i += BATCH_SIZE) {
      const batchPromises = [];
      const batchSize = Math.min(BATCH_SIZE, REGISTRATIONS - i);

      for (let j = 0; j < batchSize; j++) {
        const idx = i + j;
        const code = generateCode();
        const email = `guest-loadtest-${idx}-${Date.now()}@test.pmcc4thwatch.us`;
        const guestId = new mongoose.Types.ObjectId();

        batchPromises.push((async () => {
          const start = Date.now();
          try {
            // Create guest user
            await db.collection('users').insertOne({
              _id: guestId,
              name: `Guest ${idx}`,
              email,
              phone: `+1555${String(idx).padStart(7, '0')}`,
              role: 'guest',
              status: 'approved',
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            // Create registration (walk-in = attended immediately)
            const regId = new mongoose.Types.ObjectId();
            await db.collection('event-registrations').insertOne({
              _id: regId,
              inviteCode: code,
              event: testEventId,
              sourceType: 'walk-in',
              guest: guestId,
              guestInfo: { name: `Guest ${idx}`, email, phone: `+1555${String(idx).padStart(7, '0')}` },
              qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${code}`,
              qrCodeData: code,
              status: 'registered',
              registeredAt: new Date(),
              registeredBy: testAdminId,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            createdRegIds.push(regId);
            createdUserIds.push(guestId);
            regLatencies.push(Date.now() - start);
          } catch (err) {
            regErrors++;
            regLatencies.push(Date.now() - start);
          }
        })());
      }

      await Promise.all(batchPromises);

      // Progress
      const done = Math.min(i + BATCH_SIZE, REGISTRATIONS);
      const elapsed = Date.now() - regStart;
      const rate = done / (elapsed / 1000);
      process.stdout.write(`\r   ${done.toLocaleString()}/${REGISTRATIONS.toLocaleString()} registrations | ${rate.toFixed(0)} ops/sec | ${fmtMs(elapsed)} elapsed`);
    }

    const regTotal = Date.now() - regStart;
    regLatencies.sort((a, b) => a - b);

    console.log(`\n\n   ✅ Registration phase complete`);
    console.log(`   Time:       ${fmtMs(regTotal)}`);
    console.log(`   Throughput: ${(REGISTRATIONS / (regTotal / 1000)).toFixed(0)} ops/sec`);
    console.log(`   Errors:     ${regErrors}`);
    console.log(`   Latency:    p50=${fmtMs(p50(regLatencies))} p90=${fmtMs(p90(regLatencies))} p95=${fmtMs(p95(regLatencies))} p99=${fmtMs(p99(regLatencies))}`);

    // ============================================================
    // PHASE 2: CHECK-INS (simulates QR scanning)
    // ============================================================
    const checkinCount = Math.min(CHECKINS, createdRegIds.length);
    console.log(`\n\n🔍 PHASE 2: ${checkinCount.toLocaleString()} check-ins at ${CONCURRENCY} concurrency...\n`);
    const checkinStart = Date.now();

    // Get registration codes for check-in
    const regsToCheckin = createdRegIds.slice(0, checkinCount);

    for (let i = 0; i < regsToCheckin.length; i += BATCH_SIZE) {
      const batchPromises = [];
      const batchSize = Math.min(BATCH_SIZE, regsToCheckin.length - i);

      for (let j = 0; j < batchSize; j++) {
        const regId = regsToCheckin[i + j];
        batchPromises.push((async () => {
          const start = Date.now();
          try {
            // Lookup by code (simulates QR scan)
            const reg = await db.collection('event-registrations').findOne(
              { _id: regId },
              { projection: { inviteCode: 1, status: 1 } }
            );

            if (reg && reg.status !== 'attended') {
              // Update to attended
              await db.collection('event-registrations').updateOne(
                { _id: regId },
                { $set: { status: 'attended', attendedAt: new Date(), checkedInBy: testAdminId, updatedAt: new Date() } }
              );
            }
            checkinLatencies.push(Date.now() - start);
          } catch (err) {
            checkinErrors++;
            checkinLatencies.push(Date.now() - start);
          }
        })());
      }

      await Promise.all(batchPromises);

      const done = Math.min(i + BATCH_SIZE, regsToCheckin.length);
      const elapsed = Date.now() - checkinStart;
      const rate = done / (elapsed / 1000);
      process.stdout.write(`\r   ${done.toLocaleString()}/${checkinCount.toLocaleString()} check-ins | ${rate.toFixed(0)} ops/sec | ${fmtMs(elapsed)} elapsed`);
    }

    const checkinTotal = Date.now() - checkinStart;
    checkinLatencies.sort((a, b) => a - b);

    console.log(`\n\n   ✅ Check-in phase complete`);
    console.log(`   Time:       ${fmtMs(checkinTotal)}`);
    console.log(`   Throughput: ${(checkinCount / (checkinTotal / 1000)).toFixed(0)} ops/sec`);
    console.log(`   Errors:     ${checkinErrors}`);
    console.log(`   Latency:    p50=${fmtMs(p50(checkinLatencies))} p90=${fmtMs(p90(checkinLatencies))} p95=${fmtMs(p95(checkinLatencies))} p99=${fmtMs(p99(checkinLatencies))}`);

    // ============================================================
    // PHASE 3: STATS QUERY (simulates booth page polling)
    // ============================================================
    console.log(`\n\n📊 PHASE 3: 100 stats queries (booth page simulation)...\n`);
    const statsLatencies = [];
    const statsStart = Date.now();

    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      try {
        const totalRegs = await db.collection('event-registrations').countDocuments({ event: testEventId });
        const attended = await db.collection('event-registrations').countDocuments({ event: testEventId, status: { $in: ['attended', 'baptized'] } });
        const baptized = await db.collection('event-registrations').countDocuments({ event: testEventId, status: 'baptized' });
        const waitlisted = await db.collection('event-registrations').countDocuments({ event: testEventId, status: 'waitlisted' });
        statsLatencies.push(Date.now() - start);
      } catch {
        statsLatencies.push(Date.now() - start);
      }
    }

    statsLatencies.sort((a, b) => a - b);
    const statsTotal = Date.now() - statsStart;

    console.log(`   ✅ Stats queries complete`);
    console.log(`   100 queries in ${fmtMs(statsTotal)} (${(100 / (statsTotal / 1000)).toFixed(0)} queries/sec)`);
    console.log(`   Latency:    p50=${fmtMs(p50(statsLatencies))} p90=${fmtMs(p90(statsLatencies))} p95=${fmtMs(p95(statsLatencies))} p99=${fmtMs(p99(statsLatencies))}`);

    // ============================================================
    // SUMMARY
    // ============================================================
    const totalTime = Date.now() - regStart;
    console.log('\n==========================================');
    console.log('  SUMMARY');
    console.log('==========================================');
    console.log(`  Total time:      ${fmtMs(totalTime)}`);
    console.log(`  Total ops:       ${(REGISTRATIONS + checkinCount + 100).toLocaleString()}`);
    console.log(`  Overall rate:    ${((REGISTRATIONS + checkinCount + 100) / (totalTime / 1000)).toFixed(0)} ops/sec`);
    console.log(`  Reg errors:      ${regErrors}/${REGISTRATIONS}`);
    console.log(`  Checkin errors:  ${checkinErrors}/${checkinCount}`);
    console.log('');

    // Capacity assessment
    const regRate = REGISTRATIONS / (regTotal / 1000);
    const timeFor5k = 5000 / regRate;
    console.log(`  📈 Capacity Assessment:`);
    console.log(`     Registration throughput: ${regRate.toFixed(0)} ops/sec`);
    console.log(`     Time for 5,000 regs:    ${fmtMs(timeFor5k * 1000)}`);
    console.log(`     Check-in throughput:     ${(checkinCount / (checkinTotal / 1000)).toFixed(0)} ops/sec`);
    console.log(`     Stats query avg:         ${fmtMs(statsLatencies[Math.floor(statsLatencies.length * 0.5)])}`);

    if (timeFor5k < 300) {
      console.log(`\n  ✅ PASS: Can handle 5,000 registrations in under 5 minutes`);
    } else if (timeFor5k < 1800) {
      console.log(`\n  ⚠️  MARGINAL: 5,000 registrations would take ${fmtMs(timeFor5k * 1000)}`);
    } else {
      console.log(`\n  ❌ FAIL: 5,000 registrations would take ${fmtMs(timeFor5k * 1000)} — too slow`);
    }

  } finally {
    // ============================================================
    // CLEANUP
    // ============================================================
    console.log('\n🧹 Cleaning up test data...');
    const cleanupStart = Date.now();

    await db.collection('event-registrations').deleteMany({ event: testEventId });
    await db.collection('managed-events').deleteOne({ _id: testEventId });
    await db.collection('users').deleteOne({ _id: testAdminId });

    // Clean up guest users
    if (createdUserIds.length > 0) {
      // Delete in chunks to avoid BSON size limit
      for (let i = 0; i < createdUserIds.length; i += 1000) {
        const chunk = createdUserIds.slice(i, i + 1000);
        await db.collection('users').deleteMany({ _id: { $in: chunk } });
      }
    }

    console.log(`   Cleaned up in ${Date.now() - cleanupStart}ms`);
    await mongoose.disconnect();
    console.log('   Disconnected.\n');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
