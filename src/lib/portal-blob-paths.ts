import { canonicalBlobPathname } from "./blob-pathname";

/** Pathnames the authenticated portal may fetch via `/api/blob` (ideas + tablo admin media only). */

const BLOB_STORE_PREFIX = "berlinxkw/";

const PORTAL_BLOB_PREFIXES = [`${BLOB_STORE_PREFIX}ideas/`, `${BLOB_STORE_PREFIX}tablos/`] as const;

export function isPortalBlobProxyPathname(pathname: string): boolean {
  const canonical = canonicalBlobPathname(pathname);
  if (!canonical) return false;
  if (canonical === `${BLOB_STORE_PREFIX}store.json`) return false;
  if (canonical.startsWith(`${BLOB_STORE_PREFIX}system/`)) return false;
  return PORTAL_BLOB_PREFIXES.some((prefix) => canonical.startsWith(prefix));
}
