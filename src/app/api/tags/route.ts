import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";

export async function GET() {
  try {
    const payload = await getPayload({ config });

    const tags = await payload.find({
      collection: "tags",
      limit: 100,
      sort: "name",
    });

    const transformedTags = tags.docs.map((tag: Record<string, unknown>) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      color: tag.color || "#D4A438",
      icon: tag.icon,
      description: tag.description,
    }));

    return NextResponse.json({ tags: transformedTags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
