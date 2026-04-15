interface GeoResult {
  city: string;
  region: string;
  country: string;
}

// Module-level cache to deduplicate IP lookups within a single serverless invocation
const cache = new Map<string, GeoResult | null>();

function isPrivateIp(ip: string): boolean {
  return (
    ip === "unknown" ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
    ip.startsWith("fc00:") ||
    ip.startsWith("fe80:")
  );
}

export async function lookupIp(ip: string): Promise<GeoResult | null> {
  if (isPrivateIp(ip)) return null;

  const cached = cache.get(ip);
  if (cached !== undefined) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,city,regionName,country`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      cache.set(ip, null);
      return null;
    }

    const data = await res.json();
    if (data.status !== "success" || !data.city) {
      cache.set(ip, null);
      return null;
    }

    const result: GeoResult = {
      city: data.city,
      region: data.regionName || "",
      country: data.country || "",
    };

    cache.set(ip, result);
    return result;
  } catch {
    cache.set(ip, null);
    return null;
  }
}
