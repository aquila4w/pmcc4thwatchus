/**
 * Bulk insert 5,000 test registrations directly into MongoDB.
 * Much faster than API-based insert (~5 seconds vs 80+ minutes).
 *
 * All test data is tagged with a unique batch ID for easy cleanup.
 *
 * Usage:
 *   node scripts/bulk-insert-test.mjs                  (insert 5,000)
 *   node scripts/bulk-insert-test.mjs --count=10000    (custom count)
 *   node scripts/bulk-insert-test.mjs --revert         (delete all test data)
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomInt } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

const EVENT_ID = '69e0043632042a9df05641a5';
const EVENT_TITLE = 'Home Free Global Crusade - New York 2026';
const COUNT = parseInt(process.argv.find(a => a.startsWith('--count='))?.split('=')[1]) || 5000;
const REVERT = process.argv.includes('--revert');
const BATCH_TAG = 'BULK-TEST-5000';

// Load env
for (const line of readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8').split('\n')) {
  if (line.startsWith('#') || !line.includes('=')) continue;
  const [key, ...v] = line.split('=');
  const val = v.join('=').trim().replace(/^["']|["']$/g, '');
  if (key && val) process.env[key.trim()] = val;
}

const genCode = () => {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length: 8}, () => c[randomInt(c.length)]).join('');
};

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const eventObjId = new mongoose.Types.ObjectId(EVENT_ID);

// ============================================================
// REVERT MODE
// ============================================================
if (REVERT) {
  console.log('🧹 Reverting all bulk test data...\n');
  const t0 = Date.now();

  // Find test registrations
  const testRegs = await db.collection('event-registrations').find({
    event: eventObjId,
    sourceType: BATCH_TAG,
  }).project({ _id: 1, guest: 1 }).toArray();

  console.log(`Found ${testRegs.length} test registrations`);

  if (testRegs.length > 0) {
    const regIds = testRegs.map(r => r._id);
    const guestIds = testRegs.map(r => r.guest).filter(Boolean);

    const rDel = await db.collection('event-registrations').deleteMany({ _id: { $in: regIds } });
    console.log(`Deleted ${rDel.deletedCount} registrations`);

    if (guestIds.length > 0) {
      // Delete in chunks to avoid BSON size limit
      for (let i = 0; i < guestIds.length; i += 5000) {
        const chunk = guestIds.slice(i, i + 5000);
        const gDel = await db.collection('users').deleteMany({ _id: { $in: chunk }, role: 'guest' });
        console.log(`Deleted ${gDel.deletedCount} guest users (chunk ${Math.floor(i/5000) + 1})`);
      }
    }
  }

  // Also clean up by email pattern (belt-and-suspenders)
  const emailDel = await db.collection('users').deleteMany({
    email: { $regex: /^bulk-test-/ },
  });
  if (emailDel.deletedCount > 0) console.log(`Deleted ${emailDel.deletedCount} additional guest users (by email)`);

  const finalCount = await db.collection('event-registrations').countDocuments({ event: eventObjId });
  console.log(`\n📊 Event registrations after revert: ${finalCount.toLocaleString()}`);
  console.log(`✅ Revert complete in ${Date.now() - t0}ms`);
  await mongoose.disconnect();
  process.exit(0);
}

// ============================================================
// INSERT MODE
// ============================================================
console.log('╔══════════════════════════════════════════════════╗');
console.log('║     Bulk Insert — Home Free NY (5,000 regs)     ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log(`  Event:     ${EVENT_TITLE}`);
console.log(`  Event ID:  ${EVENT_ID}`);
console.log(`  Count:     ${COUNT.toLocaleString()}`);
console.log(`  Tag:       ${BATCH_TAG}`);
console.log('════════════════════════════════════════════════════\n');

const initialCount = await db.collection('event-registrations').countDocuments({ event: eventObjId });
console.log(`📊 Event has ${initialCount.toLocaleString()} registrations before insert\n`);

// Generate all registration documents
const codes = [];
const guestIds = [];
const docs = [];
const now = new Date();

for (let i = 0; i < COUNT; i++) {
  const code = genCode();
  codes.push(code);
  const guestId = new mongoose.Types.ObjectId();
  guestIds.push(guestId);

  docs.push({
    inviteCode: code,
    event: eventObjId,
    sourceType: BATCH_TAG,
    guest: guestId,
    guestInfo: {
      name: `Test Guest ${String(i + 1).padStart(5, '0')}`,
      email: `bulk-test-${String(i + 1).padStart(5, '0')}@test.pmcc4thwatch.us`,
      phone: `+1555${String(3000000 + i)}`,
    },
    qrCodeData: code,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${code}`,
    status: 'attended',
    registeredAt: now,
    attendedAt: now,
    notes: `BULK TEST — ${BATCH_TAG}`,
    createdAt: now,
    updatedAt: now,
  });
}

// Insert registrations in batches of 1000
console.log(`📝 Inserting ${COUNT.toLocaleString()} registrations...`);
const t0 = Date.now();

for (let i = 0; i < docs.length; i += 1000) {
  const batch = docs.slice(i, i + 1000);
  await db.collection('event-registrations').insertMany(batch);
  const done = Math.min(i + 1000, docs.length);
  process.stdout.write(`\r   ${done.toLocaleString()}/${COUNT.toLocaleString()} registrations in ${((Date.now()-t0)/1000).toFixed(1)}s      `);
}

const regTime = Date.now() - t0;
console.log(`\n   ✅ ${COUNT.toLocaleString()} registrations in ${(regTime/1000).toFixed(1)}s (${(COUNT/(regTime/1000)).toFixed(0)}/sec)`);

// Insert guest users in batches of 1000
console.log(`\n👤 Creating ${COUNT.toLocaleString()} guest users...`);
const guestDocs = guestIds.map((id, i) => ({
  _id: id,
  name: `Test Guest ${String(i + 1).padStart(5, '0')}`,
  email: `bulk-test-${String(i + 1).padStart(5, '0')}@test.pmcc4thwatch.us`,
  phone: `+1555${String(3000000 + i)}`,
  role: 'guest',
  status: 'approved',
  authProvider: 'bulk-test',
  createdAt: now,
  updatedAt: now,
}));

const t1 = Date.now();
for (let i = 0; i < guestDocs.length; i += 1000) {
  const batch = guestDocs.slice(i, i + 1000);
  await db.collection('users').insertMany(batch);
  const done = Math.min(i + 1000, guestDocs.length);
  process.stdout.write(`\r   ${done.toLocaleString()}/${COUNT.toLocaleString()} guests in ${((Date.now()-t1)/1000).toFixed(1)}s      `);
}

const guestTime = Date.now() - t1;
console.log(`\n   ✅ ${COUNT.toLocaleString()} guest users in ${(guestTime/1000).toFixed(1)}s (${(COUNT/(guestTime/1000)).toFixed(0)}/sec)`);

// Verify
const finalCount = await db.collection('event-registrations').countDocuments({ event: eventObjId });
const totalInDb = await db.collection('event-registrations').countDocuments({});

console.log(`\n╔══════════════════════════════════════════════════╗`);
console.log('║                   RESULTS                        ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log(`  Event:      ${initialCount.toLocaleString()} → ${finalCount.toLocaleString()} (+${(finalCount - initialCount).toLocaleString()})`);
console.log(`  Total DB:   ${totalInDb.toLocaleString()} registrations`);
console.log(`  Reg speed:  ${(COUNT/(regTime/1000)).toFixed(0)}/sec`);
console.log(`  Tag:        ${BATCH_TAG}`);

console.log(`\n╔══════════════════════════════════════════════════╗`);
console.log('║              TO REVERT (when ready)              ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log(`\n  node scripts/bulk-insert-test.mjs --revert\n`);
console.log('  This will delete ALL test registrations and guest users.');

await mongoose.disconnect();
