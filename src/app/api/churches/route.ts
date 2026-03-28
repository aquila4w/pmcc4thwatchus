import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET() {
  try {
    const payload = await getPayload({ config });

    const churches = await payload.find({
      collection: "churches",
      limit: 100,
      sort: "name",
    });

    const result = churches.docs.map((c) => ({
      id: c.id,
      name: c.name,
      city: c.city || null,
      state: c.state || null,
    }));

    return NextResponse.json({ docs: result });
  } catch (error) {
    console.error("Failed to fetch churches:", error);
    return NextResponse.json(
      { error: "Failed to fetch churches" },
      { status: 500 }
    );
  }
}
