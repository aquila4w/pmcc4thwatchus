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
 * Get the native MongoDB collection for a Payload collection slug.
 * Returns the native driver collection (not the Mongoose model) to avoid
 * BSON version conflicts when running aggregation pipelines on serverless.
 */
export async function getModel(slug: string) {
  const payload = await getPayload({ config });
  const mongooseModel = payload.db.collections[slug];
  return mongooseModel.collection;
}
