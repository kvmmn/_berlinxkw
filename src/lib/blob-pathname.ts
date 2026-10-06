import path from "node:path";

/** Allowed public Blob keys for `/api/shop/media` (instagram + listed tablo images). */
const PUBLIC_SHOP_MEDIA_PATH =
  /^berlinxkw\/(instagram|tablos)\/[A-Za-z0-9._/-]+$/;

export type BlobPathnameRejection =
  | "empty"
  | "traversal"
  | "invalid"
  | null;

function hasTraversalSignals(raw: string): boolean {
  if (raw.includes("..")) return true;
  if (raw.includes("\\")) return true;
  if (raw.includes("\0")) return true;
  if (raw.startsWith("/")) return true;
  if (raw.includes("%")) return true;
  if (raw.includes("//")) return true;
  return false;
}

/**
 * Returns a canonical pathname safe to pass to `@vercel/blob` `get()`, or null if rejected.
 * Rejects normalization tricks (e.g. `..`, `%2e`, backslashes) before any Blob I/O.
 */
export function canonicalBlobPathname(pathname: string): string | null {
  const trimmed = pathname.trim();
  if (!trimmed) return null;

  if (hasTraversalSignals(trimmed)) return null;

  const normalized = path.posix.normalize(trimmed);
  if (normalized !== trimmed) return null;
  if (hasTraversalSignals(normalized)) return null;

  return normalized;
}

export function classifyBlobPathname(pathname: string): BlobPathnameRejection {
  const trimmed = pathname.trim();
  if (!trimmed) return "empty";
  if (hasTraversalSignals(trimmed)) return "traversal";
  const normalized = path.posix.normalize(trimmed);
  if (normalized !== trimmed || hasTraversalSignals(normalized)) return "traversal";
  return null;
}

export function isBlobStorePathname(pathname: string): boolean {
  const canonical = canonicalBlobPathname(pathname);
  if (!canonical) return false;
  return canonical.startsWith("berlinxkw/");
}

export function isPublicShopMediaPathname(pathname: string): boolean {
  const canonical = canonicalBlobPathname(pathname);
  if (!canonical) return false;
  return PUBLIC_SHOP_MEDIA_PATH.test(canonical);
}
