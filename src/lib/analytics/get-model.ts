import { Types } from "mongoose";
import type { Payload } from "payload";

/**
 * Convert a string ID to MongoDB ObjectId.
 */
export function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

/**
 * Get the Mongoose model for a Payload collection slug.
 * Accepts an existing Payload instance to avoid re-initialization.
 */
export function getModel(payload: Payload, slug: string) {
  return payload.db.collections[slug];
}
