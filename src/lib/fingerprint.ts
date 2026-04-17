/** Client-side fingerprint & metadata collection for scan tracking. */

export interface FingerprintData {
  // Display & locale
  timezone: string;
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  pixelRatio: number;
  // Hardware
  gpuVendor: string;
  gpuRenderer: string;
  cpuCores: number | null;
  deviceMemory: number | null;
  touchSupport: string;
  canvasHash: string;
  audioHash: string;
  // Network
  connectionType: string | null;
  connectionDownlink: number | null;
  connectionRtt: number | null;
  // Browser environment
  doNotTrack: string;
  cookiesEnabled: boolean;
  adBlockerDetected: boolean;
  localStorageAvailable: boolean;
  platform: string;
  // Attribution
  referrer: string;
  pageUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
}

/** Simple djb2 hash for short strings. */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function getWebGLInfo(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { vendor: "unavailable", renderer: "unavailable" };
    const ext = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
    if (!ext) return { vendor: "masked", renderer: "masked" };
    return {
      vendor: (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_VENDOR_WEBGL) || "unknown",
      renderer: (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_RENDERER_WEBGL) || "unknown",
    };
  } catch {
    return { vendor: "error", renderer: "error" };
  }
}

function getCanvasHash(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "unavailable";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(50, 0, 100, 50);
    ctx.fillStyle = "#069";
    ctx.fillText("FP-\u{1F600}", 2, 15);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("PMCC4W", 4, 35);
    return hashString(canvas.toDataURL());
  } catch {
    return "error";
  }
}

function getAudioHash(): string {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return "unavailable";
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const analyser = ctx.createAnalyser();
    const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(10000, ctx.currentTime);
    // Compress to a simple signature
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gain);
    gain.connect(ctx.destination);
    const hash = hashString(`${ctx.sampleRate}-${analyser.frequencyBinCount}-${scriptProcessor.bufferSize}`);
    oscillator.disconnect();
    ctx.close();
    return hash;
  } catch {
    return "error";
  }
}

async function detectAdBlocker(): Promise<boolean> {
  try {
    const bait = document.createElement("div");
    bait.innerHTML = "&nbsp;";
    bait.className = "adsbox ad-placement ad-banner";
    bait.style.cssText = "position:absolute;top:-10px;left:-10px;width:1px;height:1px;";
    document.body.appendChild(bait);
    await new Promise((r) => setTimeout(r, 50));
    const blocked = bait.offsetHeight === 0 || bait.offsetParent === null;
    document.body.removeChild(bait);
    return blocked;
  } catch {
    return false;
  }
}

function checkLocalStorage(): boolean {
  try {
    localStorage.setItem("_fp_test", "1");
    localStorage.removeItem("_fp_test");
    return true;
  } catch {
    return false;
  }
}

function getUTMParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    utmContent: params.get("utm_content") || "",
    utmTerm: params.get("utm_term") || "",
  };
}

function getTouchSupport(): string {
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const touchEvent = "ontouchstart" in window;
  return `${maxTouchPoints}-${touchEvent}`;
}

export async function collectFingerprint(): Promise<FingerprintData> {
  const gpu = getWebGLInfo();
  const utm = getUTMParams();
  const conn = (navigator as unknown as { connection?: { effectiveType?: string; downlink?: number; rtt?: number } }).connection;

  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    gpuVendor: gpu.vendor,
    gpuRenderer: gpu.renderer,
    cpuCores: navigator.hardwareConcurrency || null,
    deviceMemory: (navigator as unknown as { deviceMemory?: number }).deviceMemory || null,
    touchSupport: getTouchSupport(),
    canvasHash: getCanvasHash(),
    audioHash: getAudioHash(),
    connectionType: conn?.effectiveType || null,
    connectionDownlink: conn?.downlink || null,
    connectionRtt: conn?.rtt || null,
    doNotTrack: navigator.doNotTrack || "unspecified",
    cookiesEnabled: navigator.cookieEnabled,
    adBlockerDetected: await detectAdBlocker(),
    localStorageAvailable: checkLocalStorage(),
    platform: navigator.platform || "unknown",
    referrer: document.referrer || "",
    pageUrl: window.location.href,
    utmSource: utm.utmSource,
    utmMedium: utm.utmMedium,
    utmCampaign: utm.utmCampaign,
    utmContent: utm.utmContent,
    utmTerm: utm.utmTerm,
  };
}
