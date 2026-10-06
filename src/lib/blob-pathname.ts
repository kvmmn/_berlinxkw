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

const IG_BLOB_PREFIX = "berlinxkw/instagram/";

/** Portal client upload: UUID folder + `.mp4` basename only (canonical path required). */
const INSTAGRAM_VIDEO_CLIENT_UPLOAD_PATH =
  /^berlinxkw\/instagram\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[A-Za-z0-9._-]+\.mp4$/i;

export function isInstagramVideoClientUploadPathname(pathname: string): boolean {
  const canonical = canonicalBlobPathname(pathname);
  if (!canonical) return false;
  return INSTAGRAM_VIDEO_CLIENT_UPLOAD_PATH.test(canonical);
}

/** Safe relative segment under `berlinxkw/instagram/` (input must already be canonical). */
export function instagramBlobRelativePath(canonicalPathname: string): string | null {
  if (!canonicalPathname.startsWith(IG_BLOB_PREFIX)) return null;
  const rel = canonicalPathname.slice(IG_BLOB_PREFIX.length);
  return rel.length > 0 ? rel : null;
}

/**
 * Map a relative path to an absolute path under `rootDir`, or null if it would escape the root.
 * Uses the same traversal rules as blob pathnames (no `..`, `%`, etc.).
 */
export function resolvePathUnderRoot(rootDir: string, relativePath: string): string | null {
  const trimmed = relativePath.trim();
  if (!trimmed) return null;
  if (hasTraversalSignals(trimmed)) return null;

  const normalized = path.posix.normalize(trimmed);
  if (normalized !== trimmed || hasTraversalSignals(normalized)) return null;

  const resolved = path.resolve(rootDir, normalized);
  const rootResolved = path.resolve(rootDir);
  const prefix =
    rootResolved.endsWith(path.sep) ? rootResolved : `${rootResolved}${path.sep}`;

  if (!resolved.startsWith(prefix)) return null;
  return resolved;
}
