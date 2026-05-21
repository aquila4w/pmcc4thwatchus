import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

interface Church {
  localeName: string;
  name: string;
  pastor: string;
  subDistrict: string;
  address: string;
  phone: string;
  email: string;
  lat: number;
  lng: number;
  slug: string;
  facebook: string;
  distance?: number;
}

// Google Sheets configuration (server-side only - not exposed to client)
const SHEET_ID = "1tmlYhjUlbk5SU4T9kAa6hgHwg1pMscxev6s6NFyr69Y";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY || "";
const RANGE = "A8:H100";

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "Google Sheets API key not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const geocodeQuery = searchParams.get("geocode");
  const nearLat = searchParams.get("lat");
  const nearLng = searchParams.get("lng");

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

  try {
    const [response, payload] = await Promise.all([
      fetch(url),
      getPayload({ config }),
    ]);

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Failed to fetch data");
    }

    // Build slug lookup from Payload CMS churches
    const { docs: payloadChurches } = await payload.find({
      collection: "churches",
      limit: 200,
      depth: 0,
    });
    const slugMap = new Map<string, string>();
    for (const c of payloadChurches) {
      const slug = c.slug as string;
      const name = (c.name as string || "").toLowerCase();
      if (slug && name) {
        slugMap.set(name, slug);
      }
    }

    function findSlug(localeName: string): string | undefined {
      const lower = localeName.toLowerCase().trim();
      for (const [name, slug] of slugMap) {
        if (name.includes(lower)) return slug;
      }
      return undefined;
    }

    const places: Church[] = [];
    let currentSubDistrict = "Other";

    data.values?.forEach((row: string[]) => {
      if (!row || row.length === 0) return;

      if (row.length === 1 && row[0]?.trim()) {
        currentSubDistrict = row[0].trim();
        return;
      }

      if (row.length < 7) return;
      if (row[0] === "LOCALE CHURCH") return;

      const localeName = row[0]?.trim() || "";
      const lat = parseFloat(row[6]) || 0;
      const lng = parseFloat(row[7]) || 0;

      const payloadSlug = findSlug(localeName);
      const fallbackSlug = localeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      places.push({
        localeName,
        name: localeName,
        pastor: row[1]?.trim() || "",
        address: row[2]?.trim() || "",
        email: row[3]?.trim() || "",
        phone: row[4]?.trim() || "",
        subDistrict: currentSubDistrict,
        facebook: row[5]?.trim() || "",
        lat,
        lng,
        slug: payloadSlug || fallbackSlug,
      });
    });

    // Handle geocode search
    let searchLat: number | null = null;
    let searchLng: number | null = null;
    let geocodedName: string | null = null;

    if (geocodeQuery) {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(geocodeQuery)}&countrycodes=us&format=json&limit=1`,
        { headers: { "User-Agent": "PMCC4thWatch-Locate/1.0" } }
      );
      const geoData = await geoRes.json();
      if (geoData && geoData.length > 0) {
        searchLat = parseFloat(geoData[0].lat);
        searchLng = parseFloat(geoData[0].lon);
        geocodedName = geoData[0].display_name?.split(",").slice(0, 2).join(",").trim() || null;
      }
    } else if (nearLat && nearLng) {
      searchLat = parseFloat(nearLat);
      searchLng = parseFloat(nearLng);
    }

    if (searchLat !== null && searchLng !== null) {
      for (const place of places) {
        if (place.lat && place.lng) {
          place.distance = Math.round(haversine(searchLat, searchLng, place.lat, place.lng) * 10) / 10;
        }
      }
      // Sort by distance, push churches without valid coordinates to the end
      places.sort((a, b) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });
      // Only return churches that have distance (valid coordinates)
      const nearby = places.filter(p => p.distance != null);
      if (nearby.length > 0) {
        places.length = 0;
        places.push(...nearby);
      }
    }

    const response_data: Record<string, unknown> = { churches: places };
    if (geocodedName) {
      response_data.geocodedName = geocodedName;
    }

    return NextResponse.json(response_data);
  } catch (err) {
    console.error("Error fetching church data:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load church data" },
      { status: 500 }
    );
  }
}
