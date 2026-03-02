import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

type ValidCollection = "news-events" | "managed-events" | "posts" | "pages";

const validCollections: ValidCollection[] = ["news-events", "managed-events", "posts", "pages"];

// Collection-specific field mappings
const collectionFieldMap: Record<ValidCollection, { titleField: string; slugField: string }> = {
  "news-events": { titleField: "title", slugField: "slug" },
  "managed-events": { titleField: "title", slugField: "slug" },
  "posts": { titleField: "title", slugField: "slug" },
  "pages": { titleField: "title", slugField: "slug" },
};

// GET - Load document with puckData
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { collection, id } = await params;

    // Validate collection
    if (!validCollections.includes(collection as ValidCollection)) {
      return NextResponse.json(
        { error: "Invalid collection" },
        { status: 400 }
      );
    }

    // Find the document
    const doc = await payload.findByID({
      collection: collection as ValidCollection,
      id,
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const fieldMap = collectionFieldMap[collection as ValidCollection];

    return NextResponse.json({
      id: doc.id,
      title: doc[fieldMap.titleField],
      slug: doc[fieldMap.slugField],
      collection,
      puckData: doc.puckData || null,
      contentMode: doc.contentMode || "richtext",
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

// PUT - Update puckData for a document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { collection, id } = await params;
    const body = await request.json();

    // Validate collection
    if (!validCollections.includes(collection as ValidCollection)) {
      return NextResponse.json(
        { error: "Invalid collection" },
        { status: 400 }
      );
    }

    const { puckData } = body;

    if (!puckData) {
      return NextResponse.json(
        { error: "puckData is required" },
        { status: 400 }
      );
    }

    // Update the document
    const updatedDoc = await payload.update({
      collection: collection as ValidCollection,
      id,
      data: {
        puckData,
        contentMode: "puck", // Ensure content mode is set to puck
      },
    });

    const fieldMap = collectionFieldMap[collection as ValidCollection];

    return NextResponse.json({
      success: true,
      id: updatedDoc.id,
      title: updatedDoc[fieldMap.titleField],
      message: "Puck content saved successfully",
    });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}
