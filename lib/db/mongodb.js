import { MongoClient } from "mongodb";

let clientPromise = null;

function createClientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured. Set it in your environment variables.");
  }
  const client = new MongoClient(uri, { maxPoolSize: 10 });
  return client.connect();
}

/**
 * Returns a connected MongoClient, throwing a clear error if MONGODB_URI
 * isn't set. Deliberately lazy — nothing happens at module import time, so
 * pages/routes that don't use the database are unaffected even before
 * MONGODB_URI is configured, and Next's build-time page analysis never
 * triggers a connection attempt.
 */
export async function getMongoClient() {
  // In dev, Next.js hot-reloads modules on every change, which would
  // otherwise open a fresh MongoDB connection each time. Caching the
  // client promise on `global` survives the reload. In production,
  // module state persists for the lifetime of a warm serverless
  // instance, so this also naturally reuses the connection across
  // invocations without extra work.
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClientPromise();
  }
  clientPromise = global._mongoClientPromise;
  return clientPromise;
}

/** Returns the app's database (defaults to "hrms", override with MONGODB_DB_NAME). */
export async function getDb() {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB_NAME || "hrms");
}
