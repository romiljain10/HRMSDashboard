// Minimal in-memory cache for server-side BambooHR responses.
// Good enough for a single Node process; swap for Redis if you scale to
// multiple instances.

const store = new Map();

function ttlMs() {
  const seconds = Number(process.env.BAMBOOHR_CACHE_TTL) || 60;
  return seconds * 1000;
}

export async function cached(key, fn) {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.value;
  }

  const value = await fn();
  store.set(key, { value, expiresAt: now + ttlMs() });
  return value;
}

export function invalidate(key) {
  store.delete(key);
}

export function invalidatePrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
