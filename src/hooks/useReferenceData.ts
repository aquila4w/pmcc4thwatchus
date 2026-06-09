"use client";

import { useState, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────
interface RefChurch {
  id: string;
  name: string;
  city?: string;
}

interface RefSubDistrict {
  id: string;
  name: string;
}

// ── Module-level singleton cache ───────────────────────────────────
// Fetched once per browser session (or until the tab is refreshed).
// All consuming components share the same data — no duplicate requests.

let cachedChurches: RefChurch[] | null = null;
let cachedSubDistricts: RefSubDistrict[] | null = null;
let loadingPromise: Promise<void> | null = null;

async function loadReferenceData(): Promise<void> {
  const [churchesRes, subDistrictsRes] = await Promise.all([
    fetch("/payload-api/churches?limit=999&depth=0&fields[0]=id&fields[1]=name&fields[2]=city"),
    fetch("/payload-api/sub-districts?limit=999&depth=0&fields[0]=id&fields[1]=name"),
  ]);

  if (churchesRes.ok) {
    const data = await churchesRes.json();
    cachedChurches = (data.docs || []).map((d: Record<string, unknown>) => ({
      id: d.id as string,
      name: d.name as string,
      city: d.city as string | undefined,
    }));
  }

  if (subDistrictsRes.ok) {
    const data = await subDistrictsRes.json();
    cachedSubDistricts = (data.docs || []).map((d: Record<string, unknown>) => ({
      id: d.id as string,
      name: d.name as string,
    }));
  }
}

function ensureLoaded(): Promise<void> {
  if (cachedChurches && cachedSubDistricts) return Promise.resolve();
  if (!loadingPromise) {
    loadingPromise = loadReferenceData();
  }
  return loadingPromise;
}

// ── Hook ───────────────────────────────────────────────────────────

export function useReferenceData() {
  const [churches, setChurches] = useState<RefChurch[]>(cachedChurches || []);
  const [subDistricts, setSubDistricts] = useState<RefSubDistrict[]>(cachedSubDistricts || []);
  const [loading, setLoading] = useState(!cachedChurches || !cachedSubDistricts);

  useEffect(() => {
    // Already cached from a previous mount — use it immediately
    if (cachedChurches && cachedSubDistricts) {
      setChurches(cachedChurches);
      setSubDistricts(cachedSubDistricts);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    ensureLoaded().then(() => {
      if (cancelled) return;
      setChurches(cachedChurches || []);
      setSubDistricts(cachedSubDistricts || []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { churches, subDistricts, loading };
}
