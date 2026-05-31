import { getPayload } from "payload";
import { Types } from "mongoose";
import config from "@payload-config";

/**
 * Convert a string ID to MongoDB ObjectId.
 */
export function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

/**
 * Get the Mongoose model for a Payload collection slug.
 */
export async function getModel(slug: string) {
  const payload = await getPayload({ config });
  return payload.db.collections[slug];
}
