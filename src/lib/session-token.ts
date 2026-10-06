/**
 * Edge-compatible signed portal session cookies (HMAC-SHA256).
 * Signing key is derived from BLOB_READ_WRITE_TOKEN, or PORTAL_SESSION_SECRET when blob is unset (local dev).
 */

export const AUTH_COOKIE = "bk_portal_session";

const SESSION_VERSION = "v1";
const SESSION_TTL_SEC = 60 * 60 * 24 * 14;
const KEY_DOMAIN = "berlinxkw-portal-session-v1";

function textEncoder(): TextEncoder {
  return new TextEncoder();
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  } catch {
    return null;
  }
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

function sessionKeyMaterial(): string | null {
  const blob = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (blob) return blob;
  const fallback = process.env.PORTAL_SESSION_SECRET?.trim();
  if (fallback) return fallback;
  return null;
}

async function importSigningKey(material: string, domain: string): Promise<CryptoKey> {
  const enc = textEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(material),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const derived = new Uint8Array(
    await crypto.subtle.sign("HMAC", baseKey, enc.encode(domain)),
  );
  return crypto.subtle.importKey(
    "raw",
    derived,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

let cachedKey: Promise<CryptoKey | null> | null = null;

export function resetSessionSigningKeyCacheForTests(): void {
  cachedKey = null;
}

async function getSigningKey(): Promise<CryptoKey | null> {
  if (!cachedKey) {
    cachedKey = (async () => {
      const material = sessionKeyMaterial();
      if (!material) return null;
      return importSigningKey(material, KEY_DOMAIN);
    })();
  }
  return cachedKey;
}

export function sessionCookieMaxAgeSec(): number {
  return SESSION_TTL_SEC;
}

export async function createSessionToken(nowSec = Math.floor(Date.now() / 1000)): Promise<string | null> {
  const key = await getSigningKey();
  if (!key) return null;
  const exp = nowSec + SESSION_TTL_SEC;
  const payloadJson = JSON.stringify({ exp });
  const payloadPart = base64UrlEncode(textEncoder().encode(payloadJson));
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, textEncoder().encode(`${SESSION_VERSION}.${payloadPart}`)),
  );
  return `${SESSION_VERSION}.${payloadPart}.${base64UrlEncode(sig)}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== SESSION_VERSION) return false;
  const payloadPart = parts[1]!;
  const sigPart = parts[2]!;
  const payloadBytes = base64UrlDecode(payloadPart);
  const sigBytes = base64UrlDecode(sigPart);
  if (!payloadBytes || !sigBytes) return false;

  let exp: number;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(payloadBytes)) as { exp?: unknown };
    if (typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp)) return false;
    exp = parsed.exp;
  } catch {
    return false;
  }
  if (exp <= nowSec) return false;

  const key = await getSigningKey();
  if (!key) return false;

  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, textEncoder().encode(`${SESSION_VERSION}.${payloadPart}`)),
  );
  return timingSafeEqual(expected, sigBytes);
}
