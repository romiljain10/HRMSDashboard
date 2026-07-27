// Server-only BambooHR API client.
// Never import this from a client component — it reads the API key from
// process.env and must only ever run on the server (API routes / RSC).

const DEFAULT_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 400;

export class BambooHRError extends Error {
  constructor(message, { status, code, cause } = {}) {
    super(message);
    this.name = "BambooHRError";
    this.status = status ?? null;
    this.code = code ?? "BAMBOOHR_ERROR";
    if (cause) this.cause = cause;
  }
}

function getConfig() {
  const subdomain = process.env.BAMBOOHR_SUBDOMAIN;
  const apiKey = process.env.BAMBOOHR_API_KEY;

  if (!subdomain || !apiKey) {
    throw new BambooHRError(
      "BambooHR credentials are not configured. Set BAMBOOHR_SUBDOMAIN and BAMBOOHR_API_KEY.",
      { code: "MISSING_CREDENTIALS" }
    );
  }

  return {
    subdomain,
    apiKey,
    baseUrl: `https://${subdomain}.bamboohr.com/api/v1`,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Low-level request wrapper: handles auth, timeout, retries (with backoff)
 * on network errors / 429 / 5xx, and normalizes errors.
 *
 * @param {string} path - path relative to /api/v1, e.g. "/employees/directory"
 * @param {object} options
 * @param {string} [options.method]
 * @param {object} [options.query] - query string params
 * @param {object} [options.body] - JSON body for POST/PUT
 * @param {string} [options.accept] - Accept header override
 */
export async function bambooRequest(path, options = {}) {
  const { subdomain, apiKey, baseUrl } = getConfig();
  const { method = "GET", query, body, accept = "application/json" } = options;

  const url = new URL(`${baseUrl}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const authHeader = "Basic " + Buffer.from(`${apiKey}:x`).toString("base64");

  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const res = await fetch(url.toString(), {
        method,
        headers: {
          Authorization: authHeader,
          Accept: accept,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeout);

      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after")) || 0;
        if (attempt < MAX_RETRIES) {
          const backoff = Math.max(retryAfter * 1000, BASE_BACKOFF_MS * 2 ** attempt);
          await sleep(backoff);
          continue;
        }
        throw new BambooHRError(
          res.status === 429 ? "BambooHR rate limit exceeded." : "BambooHR service error.",
          { status: res.status, code: res.status === 429 ? "RATE_LIMITED" : "SERVER_ERROR" }
        );
      }

      if (res.status === 401 || res.status === 403) {
        throw new BambooHRError(
          "BambooHR authentication failed. Check API key / subdomain / permissions.",
          { status: res.status, code: "AUTH_FAILED" }
        );
      }

      if (res.status === 404) {
        throw new BambooHRError("BambooHR resource not found.", {
          status: 404,
          code: "NOT_FOUND",
        });
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new BambooHRError(`BambooHR request failed (${res.status}).`, {
          status: res.status,
          code: "REQUEST_FAILED",
          cause: text,
        });
      }

      if (res.status === 204) return null;

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return await res.json();
      }
      return await res.text();
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;

      if (err instanceof BambooHRError) {
        // Only retryable errors reach here already handled above; others rethrow.
        if (err.code === "RATE_LIMITED" || err.code === "SERVER_ERROR") {
          if (attempt < MAX_RETRIES) continue;
        }
        throw err;
      }

      // Network / timeout errors: retry with backoff.
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_BACKOFF_MS * 2 ** attempt);
        continue;
      }

      throw new BambooHRError("Unable to reach BambooHR.", {
        code: err.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR",
        cause: err,
      });
    }
  }

  throw lastError instanceof BambooHRError
    ? lastError
    : new BambooHRError("BambooHR request failed after retries.", { code: "UNKNOWN" });
}

export const bambooGet = (path, query) => bambooRequest(path, { method: "GET", query });
export const bambooPost = (path, bodyData, query) =>
  bambooRequest(path, { method: "POST", body: bodyData, query });
export const bambooPut = (path, bodyData, query) =>
  bambooRequest(path, { method: "PUT", body: bodyData, query });
