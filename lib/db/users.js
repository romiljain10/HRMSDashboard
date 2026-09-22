import { getUsersCollection } from "@/lib/db/collections";
import { getConfiguredUsers, hashPassword, ROLES } from "@/lib/auth";

/**
 * One-time migration: if the `users` collection is empty but USERS_JSON
 * (or the legacy ADMIN_PASSWORD fallback) has accounts configured, import
 * them into the database with properly hashed passwords. Safe to call on
 * every login attempt — it's a no-op once the collection has any users.
 */
export async function ensureUsersImported() {
  const collection = await getUsersCollection();
  const existing = await collection.countDocuments({}, { limit: 1 });
  if (existing > 0) return;

  const legacyUsers = getConfiguredUsers();
  if (legacyUsers.length === 0) return;

  const docs = await Promise.all(
    legacyUsers.map(async (u) => ({
      username: u.username,
      passwordHash: await hashPassword(u.password),
      name: u.name,
      role: u.role,
      active: true,
      createdAt: new Date(),
      createdBy: null, // null marks accounts imported from USERS_JSON, not created via the UI
    }))
  );

  // Insert one at a time so a duplicate username (if this races with
  // another request) fails only that document, not the whole import.
  for (const doc of docs) {
    await collection.updateOne({ username: doc.username }, { $setOnInsert: doc }, { upsert: true });
  }
}

export async function findDbUser(username, password) {
  const { verifyPassword } = await import("@/lib/auth");
  const collection = await getUsersCollection();
  const user = await collection.findOne({ username, active: true });
  if (!user) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  return valid ? user : null;
}

export async function listUsers() {
  const collection = await getUsersCollection();
  return collection.find({}).sort({ createdAt: 1 }).toArray();
}

export async function countActiveAdmins(excludeId = null) {
  const collection = await getUsersCollection();
  const query = { role: "Admin", active: true };
  if (excludeId) query._id = { $ne: excludeId };
  return collection.countDocuments(query);
}

export async function createUser({ username, password, name, role, createdBy }) {
  if (!ROLES.includes(role)) throw new Error(`Invalid role. Must be one of: ${ROLES.join(", ")}`);
  if (!username || username.length < 3) throw new Error("Username must be at least 3 characters.");
  if (!password || password.length < 8) throw new Error("Password must be at least 8 characters.");

  const collection = await getUsersCollection();
  const existing = await collection.findOne({ username });
  if (existing) throw new Error("That username is already taken.");

  const doc = {
    username,
    passwordHash: await hashPassword(password),
    name: name || username,
    role,
    active: true,
    createdAt: new Date(),
    createdBy,
  };
  const result = await collection.insertOne(doc);
  return { ...doc, _id: result.insertedId, passwordHash: undefined };
}
