interface ParsedUA {
  device: string;
  os: string;
  browser: string;
}

export function parseUserAgent(ua: string): ParsedUA {
  if (!ua) {
    return { device: "unknown", os: "unknown", browser: "unknown" };
  }

  // Device detection
  let device = "desktop";
  if (/Mobile|iP(hone|od|ad)|Android.*Mobile|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/i.test(ua)) {
    device = "mobile";
  } else if (/iPad|Android(?!.*Mobile)|Silk/i.test(ua)) {
    device = "tablet";
  }

  // OS detection
  let os = "unknown";
  if (/Windows NT/i.test(ua)) {
    os = "Windows";
  } else if (/Mac OS X/i.test(ua)) {
    if (/iPhone|iPad|iPod/i.test(ua)) {
      os = "iOS";
    } else {
      os = "macOS";
    }
  } else if (/Android/i.test(ua)) {
    os = "Android";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  } else if (/CrOS/i.test(ua)) {
    os = "ChromeOS";
  }

  // Browser detection (order matters — check specific first)
  let browser = "unknown";
  if (/Edg\//i.test(ua)) {
    browser = "Edge";
  } else if (/OPR|Opera/i.test(ua)) {
    browser = "Opera";
  } else if (/Firefox/i.test(ua)) {
    browser = "Firefox";
  } else if (/SamsungBrowser/i.test(ua)) {
    browser = "Samsung Browser";
  } else if (/CriOS/i.test(ua)) {
    browser = "Chrome (iOS)";
  } else if (/Chrome/i.test(ua) && !/Chromium|Edge|OPR|Brave/i.test(ua)) {
    browser = "Chrome";
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = "Safari";
  }

  return { device, os, browser };
}
