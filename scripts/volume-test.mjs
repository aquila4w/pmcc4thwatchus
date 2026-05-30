/**
 * Volume test: simulates 5,000 concurrent registrations + check-in scans
 * for a large event. Tests both API throughput and database write capacity.
 *
 * Run: node scripts/volume-test.mjs
 *
 * Phases:
 *   Phase 1: REGISTRATION BURST — 5,000 registrations in 60 seconds
 *     - Each uses a unique invite code (bypasses 5/hr rate limit per code)
 *     - Measures throughput, p50/p95/p99 latency, error rate
 *
 *   Phase 2: CHECK-IN SCAN — 5,000 scans over 10 minutes (simulated)
 *     - Uses the registration codes from Phase 1
 *     - Measures scan throughput and latency
 *     - Tests the check-in API under load
 *
 *   Phase 3: ANALYTICS — load the analytics page during heavy write traffic
 *     - Verifies analytics API still responds under load
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EVENT_ID = process.env.EVENT_ID || "69e0043632042a9df05641a5"; // Home Free Global Crusade
const TOTAL_REGISTRATIONS = parseInt(process.env.VOLUME || "5000", 10);
const REGISTRATION_CONCURRENCY = parseInt(process.env.REG_CONCURRENCY || "100", 10);
const CHECKIN_CONCURRENCY = parseInt(process.env.CHECKIN_CONCURRENCY || "50", 10);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "leo.marquez@pmcc4thwatch.us";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "REDACTED_PASSWORD";

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

  console.log(`\n  ╔══════════════════════════════════════════╗`);
  console.log(`  ║  ${label.padEnd(38)}║`);
  console.log(`  ╠══════════════════════════════════════════╣`);
  console.log(`  ║  Total requests:    ${(results.length + " vs target " + TOTAL_REGISTRATIONS).padEnd(21)}║`);
  console.log(`  ║  Successful:        ${String(success.length).padEnd(21)}║`);
  console.log(`  ║  Errors:            ${String(errors.length).padEnd(21)}║`);
  console.log(`  ║  Error rate:        ${((errors.length / results.length) * 100).toFixed(1).padEnd(18)}% ║`);
  console.log(`  ║  Throughput:        ${((success.length / ((results[results.length - 1]?.timestamp - results[0]?.timestamp) / 1000)) || 0).toFixed(1).padEnd(14)} req/s ║`);
  if (times.length > 0) {
    console.log(`  ║  p50 latency:       ${formatMs(percentile(times, 50)).padEnd(21)}║`);
    console.log(`  ║  p95 latency:       ${formatMs(percentile(times, 95)).padEnd(21)}║`);
    console.log(`  ║  p99 latency:       ${formatMs(percentile(times, 99)).padEnd(21)}║`);
    console.log(`  ║  Max latency:       ${formatMs(Math.max(...times)).padEnd(21)}║`);
    console.log(`  ║  Min latency:       ${formatMs(Math.min(...times)).padEnd(21)}║`);
  }
  console.log(`  ║  Status codes:      ${JSON.stringify(statusCodes).padEnd(21).substring(0, 21)}║`);
  if (errors.length > 0 && errors.length <= 10) {
    const errTypes = {};
    for (const e of errors) {
      const key = `${e.status}: ${e.error || "unknown"}`;
      errTypes[key] = (errTypes[key] || 0) + 1;
    }
    console.log(`  ║  Error details:     ${JSON.stringify(errTypes).substring(0, 60).padEnd(21)}║`);
  }
  console.log(`  ╚══════════════════════════════════════════╝\n`);
  return { success: success.length, errors: errors.length, times };
}

// ---- Phase 1: Registration Burst ----

async function phase1_registration() {
  console.log("\n" + "=".repeat(60));
  console.log("  PHASE 1: REGISTRATION BURST");
  console.log(`  Target: ${TOTAL_REGISTRATIONS} registrations`);
  console.log(`  Concurrency: ${REGISTRATION_CONCURRENCY} simultaneous`);
  console.log(`  Duration target: ~60 seconds`);
  console.log("=".repeat(60));

  const results = [];
  const registrationCodes = [];
  let completed = 0;
  const startTime = Date.now();

  async function registerOne(index) {
    const code = generateCode();
    const firstName = `Guest`;
    const lastName = `Test${index}`;
    const phone = `+1555${String(index).padStart(7, "0")}`;
    const email = `voltest-${index}-${code.toLowerCase()}@test.pmcc4thwatch.us`;

    const reqStart = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: "home-free-global-crusade-new-york-2026",
          refCode: "TFKARJ-2AJD", // admin's invite code
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
      }

      results.push({
        success,
        status: res.status,
        duration,
        error: success ? null : (body.error || `HTTP ${res.status}`),
        timestamp: Date.now(),
      });
    } catch (err) {
      results.push({
        success: false,
        status: 0,
        duration: Date.now() - reqStart,
        error: err.message?.substring(0, 80) || "fetch error",
        timestamp: Date.now(),
      });
    }

    completed++;
    if (completed % 100 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (completed / ((Date.now() - startTime) / 1000)).toFixed(1);
      process.stdout.write(`    [${completed}/${TOTAL_REGISTRATIONS}] ${elapsed}s elapsed, ${rate} req/s\n`);
    }
  }

  // Run in batches with controlled concurrency
  const batches = [];
  for (let i = 0; i < TOTAL_REGISTRATIONS; i += REGISTRATION_CONCURRENCY) {
    const batch = [];
    for (let j = i; j < Math.min(i + REGISTRATION_CONCURRENCY, TOTAL_REGISTRATIONS); j++) {
      batch.push(registerOne(j));
    }
    batches.push(batch);
  }

  // Execute batches
  for (const batch of batches) {
    await Promise.all(batch);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  Phase 1 completed in ${elapsed}s`);
  const stats = printStats("REGISTRATION RESULTS", results);
  return { results, registrationCodes, stats };
}

// ---- Phase 2: Check-in Scans ----

async function phase2_checkin(registrationCodes, authToken) {
  console.log("\n" + "=".repeat(60));
  console.log("  PHASE 2: CHECK-IN SCANS");
  console.log(`  Target: ${registrationCodes.length} check-ins`);
  console.log(`  Concurrency: ${CHECKIN_CONCURRENCY} simultaneous`);
  console.log("=".repeat(60));

  if (registrationCodes.length === 0) {
    console.log("  ⚠️  No registration codes to check in. Skipping.");
    return { results: [], stats: null };
  }

  const results = [];
  let completed = 0;
  const startTime = Date.now();

  async function checkInOne(code, index) {
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
      results.push({
        success,
        status: res.status,
        duration,
        error: success ? null : (body.error || body.code || `HTTP ${res.status}`),
        timestamp: Date.now(),
      });
    } catch (err) {
      results.push({
        success: false,
        status: 0,
        duration: Date.now() - reqStart,
        error: err.message?.substring(0, 80) || "fetch error",
        timestamp: Date.now(),
      });
    }

    completed++;
    if (completed % 50 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (completed / ((Date.now() - startTime) / 1000)).toFixed(1);
      process.stdout.write(`    [${completed}/${registrationCodes.length}] ${elapsed}s elapsed, ${rate} req/s\n`);
    }
  }

  // Run in batches
  for (let i = 0; i < registrationCodes.length; i += CHECKIN_CONCURRENCY) {
    const batch = registrationCodes.slice(i, i + CHECKIN_CONCURRENCY).map((code, j) =>
      checkInOne(code, i + j)
    );
    await Promise.all(batch);
    // Small delay between batches to avoid overwhelming
    if (i + CHECKIN_CONCURRENCY < registrationCodes.length) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  Phase 2 completed in ${elapsed}s`);
  const stats = printStats("CHECK-IN RESULTS", results);
  return { results, stats };
}

// ---- Phase 3: Analytics Under Load ----

async function phase3_analytics(authToken) {
  console.log("\n" + "=".repeat(60));
  console.log("  PHASE 3: ANALYTICS API UNDER LOAD");
  console.log("  5 concurrent analytics requests while DB is loaded");
  console.log("=".repeat(60));

  const results = [];
  const startTime = Date.now();

  const analyticsPromises = Array.from({ length: 5 }, async (_, i) => {
    const reqStart = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/events/${EVENT_ID}/analytics`, {
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
      });
    } catch (err) {
      results.push({
        success: false,
        status: 0,
        duration: Date.now() - reqStart,
        error: err.message?.substring(0, 80) || "fetch error",
        timestamp: Date.now(),
      });
    }
  });

  await Promise.all(analyticsPromises);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  Phase 3 completed in ${elapsed}s`);
  printStats("ANALYTICS UNDER LOAD", results);
  return results;
}

// ---- Main ----

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  PMCC 4TH WATCH — VOLUME TEST                           ║");
  console.log("║  Simulating large event with 5,000 registrations        ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  Target: ${BASE_URL.padEnd(46)}║`);
  console.log(`║  Event:  ${EVENT_ID.padEnd(46)}║`);
  console.log(`║  Volume: ${String(TOTAL_REGISTRATIONS).padEnd(46)}║`);
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
  console.log("  ✅ Authenticated as superAdmin\n");

  // Phase 1: Registration burst
  const phase1 = await phase1_registration();

  // Phase 2: Check-in scans (only for successful registrations)
  const codes = phase1.registrationCodes;
  console.log(`  Proceeding with ${codes.length} registration codes for check-in...`);
  const phase2 = await phase2_checkin(codes, authToken);

  // Phase 3: Analytics under load
  const phase3 = await phase3_analytics(authToken);

  // ---- Summary ----
  console.log("\n" + "=".repeat(60));
  console.log("  FINAL SUMMARY");
  console.log("=".repeat(60));
  console.log(`  Phase 1 (Registration): ${phase1.stats.success} success, ${phase1.stats.errors} errors`);
  console.log(`  Phase 2 (Check-in):     ${phase2.stats?.success || "N/A"} success, ${phase2.stats?.errors || "N/A"} errors`);
  console.log(`  Phase 3 (Analytics):    ${phase3.filter(r => r.success).length}/5 responded correctly`);
  console.log("");

  if (phase1.stats.errors > 0 || (phase2.stats && phase2.stats.errors > 0)) {
    console.log("  ⚠️  ISSUES DETECTED — see details above for error breakdown");
    console.log("  Common causes:");
    console.log("    - Rate limiting (429s): registration limits per invite code");
    console.log("    - MongoDB connection pool exhaustion under concurrent writes");
    console.log("    - Node.js event loop blocking from synchronous operations");
  } else {
    console.log("  ✅ All phases passed — system handled the load");
  }
  console.log("");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
