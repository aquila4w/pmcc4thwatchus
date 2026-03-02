#!/usr/bin/env node

/**
 * Build script with extensive logging to debug Netlify build timeouts
 * Also sets environment variables to prevent MongoDB connections during build
 */

import { spawn } from "child_process";

const startTime = Date.now();

function log(message) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[${elapsed}s] ${message}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  log(title);
  console.log("=".repeat(60));
}

logSection("🚀 BUILD STARTED");

log("Environment check:");
log(`  NODE_ENV: ${process.env.NODE_ENV}`);
log(`  NODE_VERSION: ${process.version}`);
log(`  MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
log(`  PAYLOAD_SECRET exists: ${!!process.env.PAYLOAD_SECRET}`);
log(`  Memory limit: ${process.env.NODE_OPTIONS || "default"}`);

logSection("📦 Running Next.js build");

const buildProcess = spawn("bun", ["next", "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    // Critical: Prevent MongoDB connections during build
    BUILDING: "true",
    NEXT_PHASE: "phase-production-build",
  },
});

// Set up timeout warning
const warningTimeout = setTimeout(() => {
  log("⚠️  WARNING: Build has been running for 10 minutes!");
}, 10 * 60 * 1000);

const criticalTimeout = setTimeout(() => {
  log("🚨 CRITICAL: Build has been running for 15 minutes!");
  log("🚨 This suggests the build is stuck. Common causes:");
  log("   - MongoDB connection attempt during build");
  log("   - Infinite loop in page generation");
  log("   - Missing force-dynamic on server components");
}, 15 * 60 * 1000);

buildProcess.on("close", (code) => {
  clearTimeout(warningTimeout);
  clearTimeout(criticalTimeout);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  if (code === 0) {
    logSection(`✅ BUILD COMPLETED in ${totalTime}s`);
  } else {
    logSection(`❌ BUILD FAILED with code ${code} after ${totalTime}s`);
  }

  process.exit(code);
});

buildProcess.on("error", (err) => {
  clearTimeout(warningTimeout);
  clearTimeout(criticalTimeout);
  log(`❌ BUILD ERROR: ${err.message}`);
  process.exit(1);
});
