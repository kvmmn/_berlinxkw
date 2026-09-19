import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "./idea-limits";
import { getStorageMode } from "./storage";
import type { IdeaMedia } from "./types";

export { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "./idea-limits";

const LOCAL_UPLOADS = join(process.cwd(), "public", "uploads", "ideas");

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

function mediaKindFromMime(mime: string): "image" | "video" | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return null;
}

export function validateMediaFile(file: File): { ok: true; kind: "image" | "video" } | { ok: false; error: string } {
  const kind = mediaKindFromMime(file.type);
  if (!kind) {
    return { ok: false, error: "Only image or video files are allowed." };
  }
  const max = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  const maxMb = kind === "image" ? 8 : 40;
  if (file.size > max) {
    return { ok: false, error: `${kind === "image" ? "Image" : "Video"} must be ${maxMb}MB or smaller.` };
  }
  return { ok: true, kind };
}

export async function uploadIdeaMedia(
  ideaId: string,
  file: File,
): Promise<{ media: IdeaMedia } | { error: string }> {
  const check = validateMediaFile(file);
  if (!check.ok) return { error: check.error };

  const filename = sanitizeFilename(file.name);
  const bytes = Buffer.from(await file.arrayBuffer());
  const mode = getStorageMode();

  if (mode === "blob") {
    const pathname = `berlinxkw/ideas/${ideaId}/${filename}`;
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(pathname, bytes, {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type,
      });
      return {
        media: {
          kind: check.kind,
          url: blob.url,
          pathname: blob.pathname,
          mime: file.type,
          size: file.size,
        },
      };
    } catch {
      return { error: "Could not upload to Blob storage." };
    }
  }

  if (mode === "filesystem") {
    const dir = join(LOCAL_UPLOADS, ideaId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const diskPath = join(dir, filename);
    writeFileSync(diskPath, bytes);
    const url = `/uploads/ideas/${ideaId}/${filename}`;
    return {
      media: {
        kind: check.kind,
        url,
        pathname: url,
        mime: file.type,
        size: file.size,
      },
    };
  }

  return { error: "Storage is read-only — attach Blob or use local dev to upload media." };
}

export async function deleteIdeaMedia(media: IdeaMedia): Promise<void> {
  const mode = getStorageMode();
  if (mode === "blob" && media.pathname?.startsWith("berlinxkw/")) {
    try {
      const { del } = await import("@vercel/blob");
      await del(media.pathname);
    } catch {
      /* best-effort */
    }
    return;
  }
  if (mode === "filesystem" && media.url?.startsWith("/uploads/ideas/")) {
    const diskPath = join(process.cwd(), "public", media.url);
    try {
      if (existsSync(diskPath)) unlinkSync(diskPath);
    } catch {
      /* best-effort */
    }
  }
}
