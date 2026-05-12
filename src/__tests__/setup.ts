import { vi } from "vitest";

// Set all required environment variables before any module loads
process.env.PAYLOAD_SECRET = "test-secret";
process.env.NEXTAUTH_SECRET = "test-nextauth-secret";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.DATABASE_URI = "mongodb://localhost:27017/test";
process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
process.env.RESEND_API_KEY = "re_test_key";
process.env.EMAIL_FROM = "Test <test@example.com>";
process.env.TWILIO_ACCOUNT_SID = "ACtest1234567890123456789012";
process.env.TWILIO_AUTH_TOKEN = "test_auth_token_123456789012";
process.env.TWILIO_PHONE_NUMBER = "+15555555555";
process.env.CRON_SECRET = "test-cron-secret";
process.env.NODE_ENV = "test";
process.env.GOOGLE_RECAPTCHA_SECRET_KEY = "test-recaptcha-secret";
process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY = "test-site-key";

// Suppress console.log during tests (keep console.error for debugging)
const originalLog = console.log;
console.log = (...args: unknown[]) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (msg.includes("[TEST]") || process.env.VERBOSE_TESTS) {
    originalLog(...args);
  }
};

afterEach(() => {
  vi.restoreAllMocks();
});
