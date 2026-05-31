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

/**
 * Count documents in a Payload collection using raw MongoDB countDocuments().
 * Much faster than payload.find({ limit: 0 }) which runs through full Payload middleware.
 */
export function countDocs(payload: Payload, slug: string, filter: Record<string, unknown>) {
  return payload.db.collections[slug].countDocuments(filter);
}
