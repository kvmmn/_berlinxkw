import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { headBlob, hasBlobToken, streamBlobWithRange } from "@/lib/blob-private";
import { IG_DEMO_BLOB_PATH, IG_DEMO_REEL_PATH } from "@/lib/instagram/constants";
import { readDemoPublishSampleJpeg, readDemoPublishSampleMp4 } from "@/lib/instagram/media";
import { contentRangeHeader, parseByteRange } from "@/lib/shop-media-range";

const LOCAL_INSTAGRAM_ROOT = join(process.cwd(), "public", "uploads", "instagram");

function normalizeServedContentType(pathname: string, contentType: string): string {
  const lower = pathname.toLowerCase();
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return contentType.split(";")[0].trim() || "application/octet-stream";
}

function readLocalInstagramFile(pathname: string): Buffer | null {
  const prefix = "berlinxkw/instagram/";
  if (!pathname.startsWith(prefix)) return null;
  const rel = pathname.slice(prefix.length);
  const diskPath = join(LOCAL_INSTAGRAM_ROOT, rel);
  if (!existsSync(diskPath)) return null;
  try {
    return readFileSync(diskPath);
  } catch {
    return null;
  }
}

function demoBytesForPath(pathname: string): Buffer | null {
  if (pathname === IG_DEMO_BLOB_PATH) return readDemoPublishSampleJpeg();
  if (pathname === IG_DEMO_REEL_PATH) return readDemoPublishSampleMp4();
  return null;
}

function responseFromBuffer(
  buf: Buffer,
  pathname: string,
  req: Request,
): Response {
  const contentType = normalizeServedContentType(pathname, "application/octet-stream");
  const size = buf.length;
  const range = parseByteRange(req.headers.get("Range"), size);

  const baseHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "public, max-age=3600, s-maxage=86400",
    "Accept-Ranges": "bytes",
  };

  if (range === "unsatisfiable") {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${size}` },
    });
  }

  if (range) {
    const slice = buf.subarray(range.start, range.end + 1);
    return new Response(new Uint8Array(slice), {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Length": String(slice.length),
        "Content-Range": contentRangeHeader(range.start, range.end, size),
      },
    });
  }

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      ...baseHeaders,
      "Content-Length": String(size),
    },
  });
}

export async function serveShopMedia(pathname: string, req: Request): Promise<Response> {
  const rangeHeader = req.headers.get("Range");

  if (hasBlobToken()) {
    const meta = await headBlob(pathname);
    if (meta) {
      const contentType = normalizeServedContentType(pathname, meta.contentType);
      const parsed = parseByteRange(rangeHeader, meta.size);

      if (parsed === "unsatisfiable") {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${meta.size}` },
        });
      }

      const effectiveRange =
        parsed != null
          ? `bytes=${parsed.start}-${parsed.end}`
          : rangeHeader;

      const blob = await streamBlobWithRange(pathname, effectiveRange ?? null);
      if (blob) {
        const status = parsed != null ? 206 : blob.status;
        const headers: Record<string, string> = {
          "Content-Type": contentType,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
          "Accept-Ranges": "bytes",
        };
        if (parsed) {
          headers["Content-Range"] = contentRangeHeader(parsed.start, parsed.end, meta.size);
          headers["Content-Length"] = String(parsed.end - parsed.start + 1);
        } else if (blob.contentRange) {
          headers["Content-Range"] = blob.contentRange;
        } else {
          headers["Content-Length"] = String(meta.size);
        }

        return new Response(blob.stream, { status, headers });
      }
    }
  }

  const local = readLocalInstagramFile(pathname);
  if (local) return responseFromBuffer(local, pathname, req);

  const demo = demoBytesForPath(pathname);
  if (demo) return responseFromBuffer(demo, pathname, req);

  return new Response("Not found", { status: 404 });
}
