import { NextRequest } from "next/server";

/**
 * Build a NextRequest for testing API route handlers.
 * Route handlers in Next.js 15 receive (request, context) where
 * context.params is a Promise<{paramName: string}>.
 */
export function buildRequest(options: {
  method?: string;
  url?: string;
  body?: unknown;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
}): NextRequest {
  const url = options.url || "http://localhost:3000/api/test";
  const init: RequestInit = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };

  if (options.body !== undefined && options.method !== "GET") {
    init.body = JSON.stringify(options.body);
  }

  const request = new NextRequest(url, init);

  if (options.cookies) {
    for (const [key, value] of Object.entries(options.cookies)) {
      request.cookies.set(key, value);
    }
  }

  return request;
}

/**
 * Build the params context for dynamic route segments.
 * In Next.js 15, params is a Promise.
 */
export function buildParams(params: Record<string, string>): { params: Promise<Record<string, string>> } {
  return { params: Promise.resolve(params) };
}
