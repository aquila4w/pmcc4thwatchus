import { NextResponse } from "next/server";

interface Church {
  localeName: string;
  name: string;
  pastor: string;
  address: string;
  phone: string;
  email: string;
  lat: number;
  lng: number;
  subDistrict: string;
}

// Google Sheets configuration (server-side only - not exposed to client)
const SHEET_ID = "1tmlYhjUlbk5SU4T9kAa6hgHwg1pMscxev6s6NFyr69Y";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY || "";
const RANGE = "A8:I100";

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "Google Sheets API key not configured" },
      { status: 500 }
    );
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Failed to fetch data");
    }

    const places: Church[] = [];
    let currentSubDistrict = "Other";

    data.values?.forEach((row: string[]) => {
      if (!row || row.length === 0) return;

      if (row.length === 1 && row[0]?.trim()) {
        currentSubDistrict = row[0].trim();
        return;
      }

      if (row.length < 9) return;
      if (row[0] === "LOCALE CHURCH") return;

      const localeName = row[0]?.trim() || "";
      const lat = parseFloat(row[7]) || 0;
      const lng = parseFloat(row[8]) || 0;

      if (lat === 0 || lng === 0) return;

      places.push({
        localeName,
        name: row[5]?.trim() || localeName,
        pastor: row[1]?.trim() || "",
        address: row[2]?.trim() || "",
        email: row[3]?.trim() || "",
        phone: row[4]?.trim() || "",
        subDistrict: currentSubDistrict,
        lat,
        lng,
      });
    });

    return NextResponse.json({ churches: places });
  } catch (err) {
    console.error("Error fetching church data:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load church data" },
      { status: 500 }
    );
  }
}
