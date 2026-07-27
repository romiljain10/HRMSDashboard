// Uses Web Crypto (available in both the Node runtime and the Edge runtime
// that middleware.js runs on) so the same hashing works in both places
// without pulling in Node's 'crypto' module, which isn't available at the edge.
export async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const SESSION_COOKIE_NAME = "hrms_session";

export async function expectedSessionValue() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return sha256Hex(password);
}
