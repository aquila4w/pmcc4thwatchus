import { getPayload } from "payload";
import config from "@payload-config";

/**
 * Get the Mongoose model for a Payload collection slug.
 */
export async function getModel(slug: string) {
  const payload = await getPayload({ config });
  return payload.db.collections[slug];
}

/**
 * Create pipeline stages that add a server-side ObjectId for matching.
 * Avoids client-side ObjectId creation which causes BSON version conflicts
 * when mongoose 9.x (bson 7.x) and Payload's mongoose 8.x (bson 6.x) coexist.
 */
export function oidStage(value: string, name = "__oid") {
  return { $toObjectId: value } as const;
}
