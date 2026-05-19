import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAIN_DOMAIN = "pmcc4thwatch.us";
const RESERVED_SUBDOMAINS = ["www", "admin", "cms", "api", "mail", "staging", "dev"];

function getChurchSubdomain(host: string): string | null {
  // Normalize host (remove port)
  const hostname = host.split(":")[0].toLowerCase();

  // Handle production domain
  if (hostname.endsWith(`.${MAIN_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${MAIN_DOMAIN}`, "");
    if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain) && !subdomain.includes(".")) {
      return subdomain;
    }
  }

  // Handle local development: <slug>.localhost or <slug>.localhost:3000
  if (hostname.endsWith(".localhost") || hostname.match(/\.localhost:\d+$/)) {
    const subdomain = hostname.split(".")[0];
    if (subdomain && subdomain !== "localhost" && !RESERVED_SUBDOMAINS.includes(subdomain)) {
      return subdomain;
    }
  }

  return null;
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self'",
      "frame-src https://maps.google.com/ https://www.google.com/maps/ https://www.zeffy.com/ https://www.google.com/recaptcha/",
      "connect-src 'self' https://www.google-analytics.com https://api.qrserver.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const churchSlug = getChurchSubdomain(host);

  // Rewrite church subdomain requests to the _church route group
  if (churchSlug) {
    const url = request.nextUrl.clone();
    const pathname = url.pathname === "/" ? "" : url.pathname;
    url.pathname = `/_church/${churchSlug}${pathname}`;
    const response = NextResponse.rewrite(url);
    addSecurityHeaders(response);

    // HSTS
    if (request.nextUrl.protocol === "https:") {
      response.headers.set(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload"
      );
    }

    return response;
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const hasPayloadToken = request.cookies.has("payload-token");
    const hasNextAuthToken = request.cookies.has("next-auth.session-token");

    if (!hasPayloadToken && !hasNextAuthToken) {
      const loginUrl = new URL("/member/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  addSecurityHeaders(response);

  // HSTS - only over HTTPS
  if (request.nextUrl.protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|cms/static).*)"],
};
