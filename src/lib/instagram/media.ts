import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { writeBlob } from "@/lib/blob-private";
import { isPublicShopMediaPathname } from "@/lib/blob-pathname";
import { getStorageMode } from "@/lib/storage";
import {
  IG_BLOB_PREFIX,
  IG_DEMO_BLOB_PATH,
  IG_DIRECT_UPLOAD_MAX_BYTES,
  IG_UPLOAD_VIDEO_MAX_BYTES,
} from "./constants";

export { isPublicShopMediaPathname };

export { isPublicShopMediaPathname };

const LOCAL_UPLOADS = join(process.cwd(), "public", "uploads", "instagram");
const DEMO_JPEG_FS = join(process.cwd(), "public", "shop", "demo", "publish-sample.jpg");

export function publicInstagramMediaUrl(pathname: string, origin?: string): string {
  const path = `/api/shop/media?pathname=${encodeURIComponent(pathname)}`;
  if (origin) return `${origin.replace(/\/$/, "")}${path}`;
  return path;
}

function sanitizeFilename(name: string, ext: "jpg" | "mp4"): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "media";
  const lower = base.toLowerCase();
  if (ext === "jpg") {
    return lower.endsWith(".jpg") || lower.endsWith(".jpeg") ? base : `${base}.jpg`;
  }
  return lower.endsWith(".mp4") ? base : `${base}.mp4`;
}

async function writeInstagramBlob(
  pathname: string,
  bytes: Buffer,
  contentType: string,
  mode: ReturnType<typeof getStorageMode>,
  id: string,
  filename: string,
): Promise<{ pathname: string; publicUrl: string } | { error: string }> {
  if (mode === "blob") {
    try {
      await writeBlob(pathname, bytes, contentType);
      return { pathname, publicUrl: publicInstagramMediaUrl(pathname) };
    } catch {
      return { error: "Could not upload to Blob storage." };
    }
  }

  if (mode === "filesystem") {
    const dir = join(LOCAL_UPLOADS, id);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const diskPath = join(dir, filename);
    writeFileSync(diskPath, bytes);
    return {
      pathname,
      publicUrl: `/uploads/instagram/${id}/${filename}`,
    };
  }

  return { error: "Storage is read-only — attach Blob or use local dev to upload media." };
}

export async function uploadInstagramJpeg(
  file: File,
): Promise<{ pathname: string; publicUrl: string } | { error: string }> {
  const mime = (file.type || "").toLowerCase();
  if (mime !== "image/jpeg" && mime !== "image/jpg") {
    return { error: "Only JPEG images are allowed for Instagram posts." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { error: "Image must be 8MB or smaller." };
  }

  const filename = sanitizeFilename(file.name, "jpg");
  const bytes = Buffer.from(await file.arrayBuffer());
  const mode = getStorageMode();
  const id = crypto.randomUUID();
  const pathname = `${IG_BLOB_PREFIX}${id}/${filename}`;
  return writeInstagramBlob(pathname, bytes, "image/jpeg", mode, id, filename);
}

export async function uploadInstagramMp4(
  file: File,
): Promise<
  | { pathname: string; publicUrl: string }
  | { error: string; useClientUpload?: boolean }
> {
  const mime = (file.type || "").toLowerCase();
  if (mime !== "video/mp4") {
    return { error: "Only MP4 video (video/mp4) is allowed for Instagram Reels uploads." };
  }
  if (file.size > IG_UPLOAD_VIDEO_MAX_BYTES) {
    return { error: "Video must be 100MB or smaller." };
  }
  if (process.env.VERCEL && file.size > IG_DIRECT_UPLOAD_MAX_BYTES) {
    return {
      error:
        "Video exceeds the server upload limit on Vercel. Use client upload (POST JSON to this route with @vercel/blob/client upload()).",
      useClientUpload: true,
    };
  }

  const filename = sanitizeFilename(file.name, "mp4");
  const bytes = Buffer.from(await file.arrayBuffer());
  const mode = getStorageMode();
  const id = crypto.randomUUID();
  const pathname = `${IG_BLOB_PREFIX}${id}/${filename}`;
  return writeInstagramBlob(pathname, bytes, "video/mp4", mode, id, filename);
}

/** Demo JPEG bytes for /api/shop/media fallback (preview dryRun without Blob upload). */
export function readDemoPublishSampleJpeg(): Buffer | null {
  if (!existsSync(DEMO_JPEG_FS)) return null;
  try {
    return readFileSync(DEMO_JPEG_FS);
  } catch {
    return null;
  }
}

export { IG_DEMO_BLOB_PATH };
