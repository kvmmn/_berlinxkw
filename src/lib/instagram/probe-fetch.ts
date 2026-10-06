/** Safe outbound fetches for dryRun media probing (SSRF-hardened). */

export const PROBE_FETCH_TIMEOUT_MS = 10_000;

export const PROBE_IMAGE_MAX_BYTES = 65536;
export const PROBE_VIDEO_META_MAX_BYTES = 262144;

export class ProbeUrlRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProbeUrlRejectedError";
  }
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, "");
}

/** Hostnames permitted for Instagram dryRun probing (video, cover, and allowlisted image probes). */
export function isAllowedProbeHostname(hostname: string): boolean {
  const h = normalizeHostname(hostname);
  if (h === "berlinxkw.vercel.app") return true;

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    try {
      const parsed = new URL(vercelUrl.includes("://") ? vercelUrl : `https://${vercelUrl}`);
      if (normalizeHostname(parsed.hostname) === h) return true;
    } catch {
      /* ignore malformed VERCEL_URL */
    }
  }

  if (h.endsWith(".public.blob.vercel-storage.com")) return true;

  if (process.env.NODE_ENV !== "production" && (h === "localhost" || h === "127.0.0.1")) {
    return true;
  }

  return false;
}

export function assertProbeUrlAllowed(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ProbeUrlRejectedError("Invalid URL.");
  }

  if (parsed.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && parsed.protocol === "http:" && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"))) {
    throw new ProbeUrlRejectedError("Media URL must use HTTPS.");
  }

  if (!isAllowedProbeHostname(parsed.hostname)) {
    throw new ProbeUrlRejectedError(
      `Media URL host is not allowed for probing (use berlinxkw.vercel.app shop media or Vercel Blob).`,
    );
  }

  return parsed;
}

function mergeSignals(timeoutMs: number, extra?: AbortSignal | null): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  if (!extra) return timeout;
  return AbortSignal.any([timeout, extra]);
}

export function rejectRedirectResponse(res: Response): void {
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location") ?? "";
    throw new ProbeUrlRejectedError(
      location
        ? `Media URL redirected to ${location} (redirects are not allowed).`
        : "Media URL returned a redirect (redirects are not allowed).",
    );
  }
}

export async function readResponseBodyCapped(res: Response, maxBytes: number): Promise<Buffer> {
  if (!res.body) return Buffer.alloc(0);

  const reader = res.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value);
      if (total + chunk.length > maxBytes) {
        chunks.push(chunk.subarray(0, maxBytes - total));
        total = maxBytes;
        await reader.cancel();
        break;
      }
      chunks.push(chunk);
      total += chunk.length;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* already released */
    }
  }

  return Buffer.concat(chunks);
}

export type SafeProbeFetchInit = {
  method?: string;
  headers?: HeadersInit;
  maxBodyBytes?: number;
};

/** Fetch with allowlist, manual redirects, timeout, and optional capped body read. */
export async function safeProbeFetch(
  url: string,
  init: SafeProbeFetchInit = {},
): Promise<{ res: Response; body: Buffer }> {
  assertProbeUrlAllowed(url);

  const method = init.method ?? "GET";
  const res = await fetch(url, {
    method,
    redirect: "manual",
    cache: "no-store",
    headers: init.headers,
    signal: mergeSignals(PROBE_FETCH_TIMEOUT_MS),
  });

  rejectRedirectResponse(res);

  const maxBytes = init.maxBodyBytes ?? 0;
  if (maxBytes <= 0) {
    return { res, body: Buffer.alloc(0) };
  }

  if (!res.ok && res.status !== 206) {
    return { res, body: Buffer.alloc(0) };
  }

  const body = await readResponseBodyCapped(res, maxBytes);
  return { res, body };
}
