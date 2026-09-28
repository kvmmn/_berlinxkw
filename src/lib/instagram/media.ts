import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { writeBlob } from "@/lib/blob-private";
import { isPublicTabloBlobPathname } from "@/lib/tablo-media";
import { getStorageMode } from "@/lib/storage";
import { IG_BLOB_PREFIX, IG_DEMO_BLOB_PATH } from "./constants";

const LOCAL_UPLOADS = join(process.cwd(), "public", "uploads", "instagram");
const DEMO_JPEG_FS = join(process.cwd(), "public", "shop", "demo", "publish-sample.jpg");

export function isPublicInstagramBlobPathname(pathname: string): boolean {
  return pathname.startsWith(IG_BLOB_PREFIX);
}

export function isPublicShopMediaPathname(pathname: string): boolean {
  return isPublicTabloBlobPathname(pathname) || isPublicInstagramBlobPathname(pathname);
}

export function publicInstagramMediaUrl(pathname: string, origin?: string): string {
  const path = `/api/shop/media?pathname=${encodeURIComponent(pathname)}`;
  if (origin) return `${origin.replace(/\/$/, "")}${path}`;
  return path;
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "image";
  return base.toLowerCase().endsWith(".jpg") || base.toLowerCase().endsWith(".jpeg")
    ? base
    : `${base}.jpg`;
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

  const filename = sanitizeFilename(file.name);
  const bytes = Buffer.from(await file.arrayBuffer());
  const mode = getStorageMode();
  const id = crypto.randomUUID();

  if (mode === "blob") {
    const pathname = `${IG_BLOB_PREFIX}${id}/${filename}`;
    try {
      await writeBlob(pathname, bytes, "image/jpeg");
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
    const pathname = `${IG_BLOB_PREFIX}${id}/${filename}`;
    return {
      pathname,
      publicUrl: `/uploads/instagram/${id}/${filename}`,
    };
  }

  return { error: "Storage is read-only — attach Blob or use local dev to upload media." };
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
