import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const payload = await getPayload({ config });

    // Find the church by slug
    const churches = await payload.find({
      collection: "churches",
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    });

    const church = churches.docs[0];
    if (!church) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    // Find the church site
    const sites = await payload.find({
      collection: "church-sites",
      where: { church: { equals: church.id } },
      limit: 1,
      depth: 2,
    });

    const site = sites.docs[0];
    if (!site) {
      return NextResponse.json({ error: "Church site not found" }, { status: 404 });
    }

    if (!site.published) {
      return NextResponse.json(
        { error: "Site not published", published: false, church: { name: church.name, slug: church.slug } },
        { status: 200 }
      );
    }

    return NextResponse.json({
      site,
      church: {
        id: church.id,
        name: church.name,
        slug: church.slug,
        address: church.address,
        city: church.city,
        state: church.state,
        zip: church.zip,
        phone: church.phone,
        email: church.email,
        image: church.image,
      },
    });
  } catch (error) {
    console.error("Error fetching church site:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
