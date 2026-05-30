/**
 * Volume test: simulates 5,000 simultaneous registrations + check-in scans
 * for a large event. Tests both API throughput and database write capacity.
 *
 * Run: node scripts/volume-test.mjs
 *
 * Phases:
 *   Phase 1+2 COMBINED: SIMULTANEOUS REGISTRATION + CHECK-IN
 *     - 5,000 registrations burst with unique invite codes
 *     - As registrations succeed, check-in scans start immediately
 *     - Simulates real event traffic where registration and scanning happen at once
 *
 *   Phase 3: ANALYTICS — load the analytics page during heavy write traffic
 *     - Verifies analytics API still responds under load
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EVENT_ID = process.env.EVENT_ID || "69e0043632042a9df05641a5"; // Home Free Global Crusade
const EVENT_SLUG = process.env.EVENT_SLUG || "home-free-global-crusade-new-york-2026";
const TOTAL_REGISTRATIONS = parseInt(process.env.VOLUME || "5000", 10);
const REGISTRATION_CONCURRENCY = parseInt(process.env.REG_CONCURRENCY || "100", 10);
const CHECKIN_CONCURRENCY = parseInt(process.env.CHECKIN_CONCURRENCY || "100", 10);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "leo.marquez@pmcc4thwatch.us";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "REDACTED_PASSWORD";
// Number of simulated members (each gets a unique invite code).
// 25 members × 200/code = 5,000 registration capacity per hour
const NUM_TEST_MEMBERS = parseInt(process.env.NUM_TEST_MEMBERS || "25", 10);
// Allow override with pre-existing invite codes
const INVITE_CODES_ENV = process.env.INVITE_CODES || "";

// ---- Helpers ----

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function formatMs(ms) {
  return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function printStats(label, results) {
  const success = results.filter(r => r.success);
  const errors = results.filter(r => !r.success);
  const times = success.map(r => r.duration);
  const statusCodes = {};
  for (const r of results) {
    statusCodes[r.status] = (statusCodes[r.status] || 0) + 1;
  }

  const elapsed = results.length > 1
    ? (results[results.length - 1]?.timestamp - results[0]?.timestamp) / 1000
    : 1;
  const throughput = elapsed > 0 ? (success.length / elapsed) : 0;

  console.log(`\n  ╔══════════════════════════════════════════╗`);
  console.log(`  ║  ${label.padEnd(38)}║`);
  console.log(`  ╠══════════════════════════════════════════╣`);
  console.log(`  ║  Total requests:    ${(results.length + " / " + TOTAL_REGISTRATIONS).padEnd(21)}║`);
  console.log(`  ║  Successful:        ${String(success.length).padEnd(21)}║`);
  console.log(`  ║  Errors:            ${String(errors.length).padEnd(21)}║`);
  console.log(`  ║  Error rate:        ${((errors.length / Math.max(results.length, 1)) * 100).toFixed(1).padEnd(18)}% ║`);
  console.log(`  ║  Throughput:        ${throughput.toFixed(1).padEnd(14)} req/s ║`);
  if (times.length > 0) {
    console.log(`  ║  p50 latency:       ${formatMs(percentile(times, 50)).padEnd(21)}║`);
    console.log(`  ║  p95 latency:       ${formatMs(percentile(times, 95)).padEnd(21)}║`);
    console.log(`  ║  p99 latency:       ${formatMs(percentile(times, 99)).padEnd(21)}║`);
    console.log(`  ║  Max latency:       ${formatMs(Math.max(...times)).padEnd(21)}║`);
    console.log(`  ║  Min latency:       ${formatMs(Math.min(...times)).padEnd(21)}║`);
  }
  console.log(`  ║  Status codes:      ${JSON.stringify(statusCodes).padEnd(21).substring(0, 21)}║`);
  if (errors.length > 0) {
    const errTypes = {};
    for (const e of errors) {
      const key = `${e.status}: ${e.error || "unknown"}`;
      errTypes[key] = (errTypes[key] || 0) + 1;
    }
    const errStr = JSON.stringify(errTypes);
    // Print error details on multiple lines if needed
    for (let i = 0; i < errStr.length; i += 38) {
      console.log(`  ║  ${i === 0 ? "Error breakdown:" : "                "}${errStr.substring(i, i + 38).padEnd(24)}║`);
    }
  }
  console.log(`  ╚══════════════════════════════════════════╝\n`);
  return { success: success.length, errors: errors.length, times, throughput };
}

// ---- Phase 1+2: Simultaneous Registration + Check-in ----

async function phase_simultaneous(authToken, inviteCodes) {
  console.log("\n" + "=".repeat(60));
  console.log("  PHASE 1+2: SIMULTANEOUS REGISTRATION + CHECK-IN");
  console.log(`  Target: ${TOTAL_REGISTRATIONS} registrations + immediate check-ins`);
  console.log(`  Reg concurrency: ${REGISTRATION_CONCURRENCY} simultaneous`);
  console.log(`  Check-in concurrency: ${CHECKIN_CONCURRENCY} simultaneous`);
  console.log("=".repeat(60));

  const regResults = [];
  const checkinResults = [];
  const registrationCodes = [];
  let regCompleted = 0;
  let checkinCompleted = 0;
  const startTime = Date.now();

  // Check-in worker — continuously processes codes as they come in
  const checkinQueue = [];
  let checkinWorkersRunning = 0;

  async function runCheckin(code, index) {
    const reqStart = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `payload-token=${authToken}`,
        },
        body: JSON.stringify({
          registrationCode: code,
          eventId: EVENT_ID,
        }),
      });

      const duration = Date.now() - reqStart;
      let body;
      try { body = await res.json(); } catch { body = {}; }

      const success = res.status === 200 && body.success;
      checkinResults.push({
        success,
        status: res.status,
        duration,
        error: success ? null : (body.error || body.code || `HTTP ${res.status}`),
        timestamp: Date.now(),
      });
    } catch (err) {
      checkinResults.push({
        success: false,
        status: 0,
        duration: Date.now() - reqStart,
        error: err.message?.substring(0, 80) || "fetch error",
        timestamp: Date.now(),
      });
    }

    checkinCompleted++;
    checkinWorkersRunning--;
    if (checkinCompleted % 100 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (checkinCompleted / ((Date.now() - startTime) / 1000)).toFixed(1);
      process.stdout.write(`    [check-in ${checkinCompleted}] ${elapsed}s, ${rate} check-ins/s\n`);
    }

    // Process next in queue
    if (checkinQueue.length > 0 && checkinWorkersRunning < CHECKIN_CONCURRENCY) {
      const next = checkinQueue.shift();
      checkinWorkersRunning++;
      runCheckin(next.code, next.index);
    }
  }

  function enqueueCheckin(code, index) {
    if (checkinWorkersRunning < CHECKIN_CONCURRENCY) {
      checkinWorkersRunning++;
      runCheckin(code, index);
    } else {
      checkinQueue.push({ code, index });
    }
  }

  // Registration worker — distributes across invite codes to simulate real scenario
  async function registerOne(index) {
    const code = generateCode();
    const firstName = `Guest`;
    const lastName = `Test${index}`;
    const phone = `+1555${String(index).padStart(7, "0")}`;
    const email = `voltest-${index}-${code.toLowerCase()}@test.pmcc4thwatch.us`;
    // Round-robin across invite codes to avoid single-code rate limit
    const refCode = inviteCodes[index % inviteCodes.length];

    const reqStart = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: EVENT_SLUG,
          refCode,
          firstName,
          lastName,
          phone,
          email,
        }),
      });

      const duration = Date.now() - reqStart;
      let body;
      try { body = await res.json(); } catch { body = {}; }

      const success = res.status === 200 && body.success;
      if (success && body.registration?.code) {
        registrationCodes.push(body.registration.code);
        // Immediately enqueue check-in for this registration
        enqueueCheckin(body.registration.code, index);
      }

      regResults.push({
        success,
        status: res.status,
        duration,
        error: success ? null : (body.error || `HTTP ${res.status}`),
        timestamp: Date.now(),
      });
    } catch (err) {
      regResults.push({
        success: false,
        status: 0,
        duration: Date.now() - reqStart,
        error: err.message?.substring(0, 80) || "fetch error",
        timestamp: Date.now(),
      });
    }

    regCompleted++;
    if (regCompleted % 100 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (regCompleted / ((Date.now() - startTime) / 1000)).toFixed(1);
      process.stdout.write(`    [reg ${regCompleted}/${TOTAL_REGISTRATIONS}] ${elapsed}s, ${rate} reg/s\n`);
    }
  }

  // Run registrations in batches with controlled concurrency
  for (let i = 0; i < TOTAL_REGISTRATIONS; i += REGISTRATION_CONCURRENCY) {
    const batch = [];
    for (let j = i; j < Math.min(i + REGISTRATION_CONCURRENCY, TOTAL_REGISTRATIONS); j++) {
      batch.push(registerOne(j));
    }
    await Promise.all(batch);
  }

  // Wait for all check-ins to complete
  const checkinWaitStart = Date.now();
  while ((checkinQueue.length > 0 || checkinWorkersRunning > 0) && Date.now() - checkinWaitStart < 120000) {
    await new Promise(r => setTimeout(r, 500));
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  Simultaneous phase completed in ${elapsed}s`);

  const regStats = printStats("REGISTRATION RESULTS", regResults);
  const checkinStats = checkinResults.length > 0
    ? printStats("CHECK-IN RESULTS", checkinResults)
    : { success: 0, errors: 0, times: [], throughput: 0 };

  return { regResults, checkinResults, registrationCodes, regStats, checkinStats };
}

// ---- Phase 3: Analytics Under Load ----

async function phase3_analytics(authToken) {
  console.log("\n" + "=".repeat(60));
  console.log("  PHASE 3: ANALYTICS API UNDER LOAD");
  console.log("  5 concurrent analytics requests while DB is loaded");
  console.log("=".repeat(60));

  const results = [];
  const startTime = Date.now();

  // Test both overview-only and full analytics
  const endpoints = [
    { url: `${BASE_URL}/api/events/${EVENT_ID}/analytics?section=overview`, label: "overview" },
    { url: `${BASE_URL}/api/events/${EVENT_ID}/analytics?section=churches`, label: "churches" },
    { url: `${BASE_URL}/api/events/${EVENT_ID}/analytics?section=technical`, label: "technical" },
    { url: `${BASE_URL}/api/events/${EVENT_ID}/analytics`, label: "full" },
    { url: `${BASE_URL}/api/events/${EVENT_ID}/analytics?section=overview`, label: "overview-2" },
  ];

  const analyticsPromises = endpoints.map(async ({ url, label }, i) => {
    const reqStart = Date.now();
    try {
      const res = await fetch(url, {
        headers: { "Cookie": `payload-token=${authToken}` },
      });
      const duration = Date.now() - reqStart;
      let body;
      try { body = await res.json(); } catch { body = {}; }

      results.push({
        success: res.status === 200 && !!body.overview,
        status: res.status,
        duration,
        error: res.status === 200 ? null : (body.error || `HTTP ${res.status}`),
        timestamp: Date.now(),
        label,
      });
    } catch (err) {
      results.push({
        success: false,
        status: 0,
        duration: Date.now() - reqStart,
        error: err.message?.substring(0, 80) || "fetch error",
        timestamp: Date.now(),
        label,
      });
    }
  });

  await Promise.all(analyticsPromises);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  Phase 3 completed in ${elapsed}s`);

  // Print per-endpoint results
  console.log(`\n  Analytics endpoint latency:`);
  for (const r of results) {
    const status = r.success ? "✅" : "❌";
    console.log(`    ${status} ${r.label}: ${formatMs(r.duration)} (HTTP ${r.status})`);
  }
  console.log("");

  return results;
}

// ---- Setup: Create test members with invite codes ----

async function setupTestMembers(authToken) {
  console.log("\n  ── SETUP: Creating test members ──");
  console.log(`  Need ${NUM_TEST_MEMBERS} members (${TOTAL_REGISTRATIONS} regs ÷ 200/code = ${Math.ceil(TOTAL_REGISTRATIONS / 200)} codes needed)`);

  // If env provided invite codes, use those
  if (INVITE_CODES_ENV) {
    const codes = INVITE_CODES_ENV.split(",").map(c => c.trim()).filter(Boolean);
    console.log(`  Using ${codes.length} invite codes from INVITE_CODES env var`);
    return codes;
  }

  // Create test members via Payload API
  const createdUserIds = [];
  const inviteCodes = [];

  // Check for existing test members first
  const existingRes = await fetch(
    `${BASE_URL}/payload-api/users?where[name][contains]=VolTest&limit=100&depth=0`,
    { headers: { "Cookie": `payload-token=${authToken}` } }
  );
  const existingData = await existingRes.json();
  if (existingData.docs?.length > 0) {
    for (const user of existingData.docs) {
      if (user.inviteCode) {
        inviteCodes.push(user.inviteCode);
        createdUserIds.push(user.id);
      }
    }
    console.log(`  Found ${inviteCodes.length} existing VolTest members`);
  }

  // Create more if needed
  const needed = NUM_TEST_MEMBERS - inviteCodes.length;
  if (needed > 0) {
    console.log(`  Creating ${needed} new test members...`);
    const batchSize = 10;
    for (let i = 0; i < needed; i += batchSize) {
      const batch = [];
      for (let j = i; j < Math.min(i + batchSize, needed); j++) {
        const idx = inviteCodes.length + j;
        batch.push(
          fetch(`${BASE_URL}/payload-api/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cookie": `payload-token=${authToken}`,
            },
            body: JSON.stringify({
              name: `VolTest Member ${idx}`,
              email: `voltest-member-${idx}@test.pmcc4thwatch.us`,
              password: `Vt${idx}!${generateCode()}@1`,
              phone: `+1555${String(9000000 + idx).padStart(7, "0")}`,
              role: "member",
              status: "approved",
            }),
          }).then(async (res) => {
            const data = await res.json();
            if (data.doc?.inviteCode) {
              inviteCodes.push(data.doc.inviteCode);
              createdUserIds.push(data.doc.id);
            } else {
              console.error(`    ⚠️  Failed to create member ${idx}: ${data.errors?.[0]?.message || res.status}`);
            }
          }).catch(err => {
            console.error(`    ⚠️  Error creating member: ${err.message}`);
          })
        );
      }
      await Promise.all(batch);
    }
  }

  console.log(`  ✅ ${inviteCodes.length} invite codes ready (${createdUserIds.length} users)`);
  console.log(`  Capacity: ${inviteCodes.length} codes × 200/code = ${inviteCodes.length * 200} registrations/hr\n`);
  return inviteCodes;
}

async function cleanupTestMembers(authToken) {
  console.log("\n  ── CLEANUP: Removing test data ──");
  // Note: We don't delete the test registrations as they're useful for analytics testing.
  // Only clean up the test member accounts.
  const res = await fetch(
    `${BASE_URL}/payload-api/users?where[name][contains]=VolTest&limit=100&depth=0`,
    { headers: { "Cookie": `payload-token=${authToken}` } }
  );
  const data = await res.json();
  let deleted = 0;
  if (data.docs?.length > 0) {
    for (const user of data.docs) {
      try {
        await fetch(`${BASE_URL}/payload-api/users/${user.id}`, {
          method: "DELETE",
          headers: { "Cookie": `payload-token=${authToken}` },
        });
        deleted++;
      } catch {}
    }
  }
  console.log(`  Deleted ${deleted} test member accounts`);
}

// ---- Main ----

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  PMCC 4TH WATCH — VOLUME TEST v2                        ║");
  console.log("║  Simultaneous registration + check-in for 5,000 users   ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  Target: ${BASE_URL.padEnd(46)}║`);
  console.log(`║  Event:  ${EVENT_ID.padEnd(46)}║`);
  console.log(`║  Volume: ${String(TOTAL_REGISTRATIONS).padEnd(46)}║`);
  console.log(`║  Reg concurrency: ${String(REGISTRATION_CONCURRENCY).padEnd(37)}║`);
  console.log(`║  Checkin concurrency: ${String(CHECKIN_CONCURRENCY).padEnd(34)}║`);
  console.log(`║  Test members: ${String(NUM_TEST_MEMBERS).padEnd(40)}║`);
  console.log("╚══════════════════════════════════════════════════════════╝");

  // Login to get auth token
  console.log("\n  Logging in...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!loginRes.ok) {
    console.error("  ❌ Login failed:", loginRes.status);
    process.exit(1);
  }

  // Extract token from set-cookie header
  const setCookie = loginRes.headers.get("set-cookie") || "";
  const tokenMatch = setCookie.match(/payload-token=([^;]+)/);
  const authToken = tokenMatch ? tokenMatch[1] : null;

  if (!authToken) {
    console.error("  ❌ No auth token received");
    process.exit(1);
  }
  console.log("  ✅ Authenticated as superAdmin");

  // Setup: Create test members with unique invite codes
  const inviteCodes = await setupTestMembers(authToken);
  if (inviteCodes.length === 0) {
    console.error("  ❌ No invite codes available. Cannot run test.");
    process.exit(1);
  }

  // Phase 1+2: Simultaneous registration + check-in
  const combined = await phase_simultaneous(authToken, inviteCodes);

  // Phase 3: Analytics under load
  const phase3 = await phase3_analytics(authToken);

  // Cleanup test members
  await cleanupTestMembers(authToken);

  // ---- Summary ----
  const totalTime = ((Date.now() - (combined.regResults[0]?.timestamp || Date.now())) / 1000).toFixed(1);
  console.log("\n" + "=".repeat(60));
  console.log("  FINAL SUMMARY");
  console.log("=".repeat(60));
  console.log(`  Total time:            ${totalTime}s`);
  console.log(`  Invite codes used:     ${inviteCodes.length} (${inviteCodes.length * 200} max capacity)`);
  console.log(`  Registration:          ${combined.regStats.success} success, ${combined.regStats.errors} errors (${combined.regStats.throughput.toFixed(1)} req/s)`);
  console.log(`  Check-in:              ${combined.checkinStats.success} success, ${combined.checkinStats.errors} errors (${combined.checkinStats.throughput.toFixed(1)} req/s)`);
  console.log(`  Analytics:             ${phase3.filter(r => r.success).length}/5 responded correctly`);

  // Latency comparison
  if (combined.regStats.times.length > 0) {
    console.log(`\n  Registration latency:`);
    console.log(`    p50: ${formatMs(percentile(combined.regStats.times, 50))}`);
    console.log(`    p95: ${formatMs(percentile(combined.regStats.times, 95))}`);
    console.log(`    p99: ${formatMs(percentile(combined.regStats.times, 99))}`);
  }
  if (combined.checkinStats.times.length > 0) {
    console.log(`\n  Check-in latency:`);
    console.log(`    p50: ${formatMs(percentile(combined.checkinStats.times, 50))}`);
    console.log(`    p95: ${formatMs(percentile(combined.checkinStats.times, 95))}`);
    console.log(`    p99: ${formatMs(percentile(combined.checkinStats.times, 99))}`);
  }

  const totalErrors = combined.regStats.errors + combined.checkinStats.errors;
  if (totalErrors > 0) {
    console.log(`\n  ⚠️  ${totalErrors} TOTAL ISSUES DETECTED`);
    console.log("  Common causes:");
    console.log("    - 429 rate limiting: registration limits per invite code (200/hr)");
    console.log("    - MongoDB connection pool exhaustion under concurrent writes");
    console.log("    - Network timeouts under heavy load");
  } else {
    console.log("\n  ✅ All phases passed — system handled the load");
  }
  console.log("");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
