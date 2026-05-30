import { getPayload } from "payload";
import { Types } from "mongoose";
import config from "@payload-config";

/**
 * Convert a string ID to MongoDB ObjectId.
 * Required in aggregation $match stages since Mongoose
 * doesn't auto-cast in .aggregate() like it does in .find().
 */
export function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

/**
 * Get the Mongoose model for a Payload collection slug.
 * The model has .aggregate() available for running pipelines.
 */
export async function getModel(slug: string) {
  const payload = await getPayload({ config });
  return payload.db.collections[slug];
}
