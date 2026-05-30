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
 * Get the native MongoDB collection for a Payload slug.
 * Uses the underlying connection for reliable .aggregate() support.
 */
export async function getCollection(slug: string) {
  const payload = await getPayload({ config });
  const db = payload.db.connection.db;
  if (!db) throw new Error("MongoDB connection not established");
  return db.collection(slug);
}
