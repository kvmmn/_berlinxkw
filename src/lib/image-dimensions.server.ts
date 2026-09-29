import "server-only";
import { readFile } from "fs/promises";
import { join } from "path";
import { hasBlobToken, isBlobStorePathname, streamBlob } from "./blob-private";
import {
  dimensionsFromBuffer,
  shopMediaPathnameFromUrl,
  type ImageDimensions,
} from "./image-dimensions";
import type { TabloImage } from "./types";

const HEADER_BYTES = 65536;

async function readStreamPrefix(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value?.length) break;
      chunks.push(Buffer.from(value));
      total += value.length;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return Buffer.concat(chunks);
}

async function probeBlobImageDimensions(pathname: string): Promise<ImageDimensions | null> {
  if (!isBlobStorePathname(pathname)) return null;
  const blob = await streamBlob(pathname);
  if (!blob) return null;
  const buf = await readStreamPrefix(blob.stream, HEADER_BYTES);
  return dimensionsFromBuffer(buf, blob.contentType);
}

function localPublicPath(url: string): string | null {
  const pathOnly = url.split("?")[0] ?? url;
  if (pathOnly.startsWith("/shop/") || pathOnly.startsWith("/uploads/")) {
    return join(process.cwd(), "public", pathOnly);
  }
  return null;
}

function publicSiteOrigin(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return "https://berlinxkw.vercel.app";
}

/** Fetch image header bytes via the public custom domain (never `VERCEL_URL`). */
async function probeViaPublicOrigin(
  url: string,
  mime?: string,
): Promise<ImageDimensions | null> {
  if (!url.startsWith("/")) return null;
  const origin = publicSiteOrigin();
  try {
    const res = await fetch(`${origin}${url}`, {
      headers: { Range: `bytes=0-${HEADER_BYTES - 1}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok && res.status !== 206) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return dimensionsFromBuffer(buf, res.headers.get("content-type") ?? mime);
  } catch {
    return null;
  }
}

async function probeTabloImageDimensionsFromBytes(
  image: TabloImage,
): Promise<ImageDimensions | null> {
  const pathname =
    (image.pathname && isBlobStorePathname(image.pathname) ? image.pathname : null) ??
    shopMediaPathnameFromUrl(image.url);

  if (pathname && hasBlobToken()) {
    const fromBlob = await probeBlobImageDimensions(pathname);
    if (fromBlob) return fromBlob;
  }

  const url = image.url;
  if (!url) return null;

  const local = localPublicPath(url);
  if (local) {
    try {
      const buf = await readFile(local);
      return dimensionsFromBuffer(buf, image.mime);
    } catch {
      /* fall through */
    }
  }

  if (url.startsWith("/api/shop/media")) {
    return probeViaPublicOrigin(url, image.mime);
  }

  if (url.startsWith("http")) {
    try {
      const res = await fetch(url, { headers: { Range: `bytes=0-${HEADER_BYTES - 1}` } });
      if (!res.ok && res.status !== 206) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return dimensionsFromBuffer(buf, res.headers.get("content-type") ?? image.mime);
    } catch {
      return null;
    }
  }

  return null;
}

/** Best-effort intrinsic size for a tablo image record. Prefer bytes (EXIF-aware) over stored fields. */
export async function probeTabloImageDimensions(
  image: TabloImage | null | undefined,
): Promise<ImageDimensions | null> {
  if (!image) return null;

  const fromBytes = await probeTabloImageDimensionsFromBytes(image);
  if (fromBytes) return fromBytes;

  if (image.width && image.height && image.width > 0 && image.height > 0) {
    return { width: image.width, height: image.height };
  }

  return null;
}

/** @deprecated Use probeTabloImageDimensions for tablo artwork. */
export async function probeImageDimensions(
  url: string | undefined,
  mime?: string,
): Promise<ImageDimensions | null> {
  if (!url) return null;
  return probeTabloImageDimensions({ url, mime });
}
