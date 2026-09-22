// Uses Web Crypto (available in both the Node runtime and the Edge runtime
// that middleware.js runs on) so the same code works in both places without
// pulling in Node's 'crypto' module, which isn't available at the edge.

export const SESSION_COOKIE_NAME = "hrms_session";

export const ROLES = ["Admin", "Payroll Manager", "Viewer"];

/**
 * Configured users. Preferred: set USERS_JSON to a JSON array like
 * [{"username":"jsmith","password":"...","name":"John Smith","role":"Admin"}, ...]
 * Falls back to a single "Admin" user from ADMIN_PASSWORD for backward
 * compatibility with the earlier single-password setup.
 */
export function getConfiguredUsers() {
  const raw = process.env.USERS_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map((u) => ({
          username: u.username,
          password: u.password,
          name: u.name || u.username,
          role: ROLES.includes(u.role) ? u.role : "Viewer",
        }));
      }
    } catch {
      // fall through to legacy single-user fallback below
    }
  }

  if (process.env.ADMIN_PASSWORD) {
    return [{ username: "admin", password: process.env.ADMIN_PASSWORD, name: "Admin", role: "Admin" }];
  }

  return [];
}

export function findUser(username, password) {
  return getConfiguredUsers().find((u) => u.username === username && u.password === password) || null;
}

function sessionSecret() {
  // Falls back to ADMIN_PASSWORD so existing deployments don't need a new
  // env var immediately — set SESSION_SECRET explicitly for production.
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

async function hmacKey() {
  const secret = sessionSecret();
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes) {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** Signs {username, name, role} into a tamper-evident cookie value. */
export async function signSession(payload) {
  if (!sessionSecret()) return null;
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = toBase64Url(new TextEncoder().encode(payloadStr));
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const sigB64 = toBase64Url(new Uint8Array(sig));
  return `${payloadB64}.${sigB64}`;
}

/** Verifies and decodes a session cookie value; returns null if invalid/tampered. */
export async function verifySession(cookieValue) {
  if (!cookieValue || !sessionSecret()) return null;
  const [payloadB64, sigB64] = cookieValue.split(".");
  if (!payloadB64 || !sigB64) return null;

  try {
    const key = await hmacKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(sigB64),
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) return null;
    return JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
  } catch {
    return null;
  }
}

// --- Password hashing (self-service user management) ---
// PBKDF2 via Web Crypto — no new npm dependency (avoids bcrypt's native
// bindings, which can be finicky in serverless environments), and works
// in both the Node and Edge runtimes since it's the same API already used
// for session signing above. Stored format: "pbkdf2$<iterations>$<saltHex>$<hashHex>".
const PBKDF2_ITERATIONS = 100_000;

function toHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(new Uint8Array(derived))}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const [, iterationsStr, saltHex, hashHex] = parts;

  try {
    const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: fromHex(saltHex), iterations: Number(iterationsStr), hash: "SHA-256" },
      keyMaterial,
      256
    );
    const computedHex = toHex(new Uint8Array(derived));
    // Constant-time-ish comparison — hashHex/computedHex are fixed-length
    // hex strings, so a simple loop avoids short-circuiting on mismatch.
    if (computedHex.length !== hashHex.length) return false;
    let diff = 0;
    for (let i = 0; i < computedHex.length; i++) diff |= computedHex.charCodeAt(i) ^ hashHex.charCodeAt(i);
    return diff === 0;
  } catch {
    return false;
  }
}
