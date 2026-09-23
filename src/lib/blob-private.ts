import "server-only";

/** Matches the linked Vercel Blob store (private). */
export const BLOB_ACCESS = "private" as const;

export const BLOB_STORE_PREFIX = "berlinxkw/";

export function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function isBlobStorePathname(pathname: string): boolean {
  return pathname.startsWith(BLOB_STORE_PREFIX);
}

/** Portal-authenticated URL for private idea media (browser img/video src). */
export function blobProxyUrl(pathname: string): string {
  return `/api/blob?pathname=${encodeURIComponent(pathname)}`;
}

async function readBlobText(pathname: string, useCache = true): Promise<string | null> {
  const { get } = await import("@vercel/blob");
  const result = await get(pathname, { access: BLOB_ACCESS, useCache });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return new Response(result.stream).text();
}

export async function readBlobJson<T>(pathname: string, useCache = false): Promise<T | null> {
  const text = await readBlobText(pathname, useCache);
  if (text === null) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function writeBlob(
  pathname: string,
  body: string | Buffer,
  contentType: string,
): Promise<void> {
  const { put } = await import("@vercel/blob");
  await put(pathname, body, {
    access: BLOB_ACCESS,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
  });
}

export async function writeBlobText(
  pathname: string,
  body: string,
  contentType: string,
): Promise<void> {
  await writeBlob(pathname, body, contentType);
}

export async function readBlobByPrefix(prefix: string): Promise<string | null> {
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix, limit: 1 });
  if (blobs.length === 0) return null;
  return readBlobText(blobs[0].pathname, false);
}

export async function streamBlob(pathname: string): Promise<{
  stream: ReadableStream<Uint8Array>;
  contentType: string;
} | null> {
  const { get } = await import("@vercel/blob");
  const result = await get(pathname, { access: BLOB_ACCESS, useCache: true });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return {
    stream: result.stream,
    contentType: result.blob.contentType ?? "application/octet-stream",
  };
}
