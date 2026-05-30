import { getPayload } from "payload";
import config from "@payload-config";

/**
 * Get the raw Mongoose model for a Payload CMS collection.
 * Use this to run .aggregate() pipelines directly on MongoDB.
 */
export async function getModel(slug: string) {
  const payload = await getPayload({ config });
  return payload.db.collections[slug];
}
