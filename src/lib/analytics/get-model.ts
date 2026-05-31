import { getPayload } from "payload";
import { ObjectId } from "mongodb";
import config from "@payload-config";

/**
 * Convert a string ID to MongoDB ObjectId.
 * Uses the mongodb driver's ObjectId (not Mongoose's) to avoid BSON version conflicts.
 */
export function toObjectId(id: string) {
  return new ObjectId(id);
}

/**
 * Get the Mongoose model for a Payload collection slug.
 * The model has .aggregate() available for running pipelines.
 */
export async function getModel(slug: string) {
  const payload = await getPayload({ config });
  return payload.db.collections[slug];
}
