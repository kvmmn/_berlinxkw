import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { blobProxyUrl, isBlobStorePathname, writeBlob } from "./blob-private";
import { MAX_IMAGE_BYTES } from "./idea-limits";
import { getStorageMode } from "./storage";
import type { Tablo, TabloImage } from "./types";

const LOCAL_UPLOADS = join(process.cwd(), "public", "uploads", "tablos");
const TABLO_BLOB_PREFIX = "berlinxkw/tablos/";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

function validateImageFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Only image files are allowed." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be 8MB or smaller." };
  }
  return { ok: true };
}

/** Portal-authenticated URL (private Blob proxy). */
export function portalTabloImageUrl(image: TabloImage | null | undefined): string | undefined {
  if (!image) return undefined;
  if (image.pathname && isBlobStorePathname(image.pathname)) {
    return blobProxyUrl(image.pathname);
  }
  if (image.url?.startsWith("/api/blob?")) {
    return image.url;
  }
  if (image.url?.startsWith("/uploads/") || image.url?.startsWith("/shop/")) {
    return image.url;
  }
  return image.url;
}

/** Public shop URL for tablo artwork (listed items only). */
export function publicTabloImageUrl(image: TabloImage | null | undefined): string | undefined {
  if (!image) return undefined;
  if (image.pathname && image.pathname.startsWith(TABLO_BLOB_PREFIX)) {
    return `/api/shop/media?pathname=${encodeURIComponent(image.pathname)}`;
  }
  if (image.url?.startsWith("/uploads/") || image.url?.startsWith("/shop/")) {
    return image.url;
  }
  return image.url;
}

function withResolvedPortalImage(image: TabloImage | null | undefined): TabloImage | null {
  if (!image) return null;
  return { ...image, url: portalTabloImageUrl(image) ?? image.url };
}

function withResolvedPublicImage(image: TabloImage | null | undefined): TabloImage | null {
  if (!image) return null;
  return { ...image, url: publicTabloImageUrl(image) ?? image.url };
}

function withResolvedPortalFramedByFinish(
  map: Tablo["framedImagesByFinish"],
): Tablo["framedImagesByFinish"] {
  if (!map) return undefined;
  const out: NonNullable<Tablo["framedImagesByFinish"]> = {};
  for (const [key, img] of Object.entries(map)) {
    if (!img) continue;
    const resolved = withResolvedPortalImage(img);
    if (resolved) out[key as keyof typeof out] = resolved;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function withResolvedPublicFramedByFinish(
  map: Tablo["framedImagesByFinish"],
): Tablo["framedImagesByFinish"] {
  if (!map) return undefined;
  const out: NonNullable<Tablo["framedImagesByFinish"]> = {};
  for (const [key, img] of Object.entries(map)) {
    if (!img) continue;
    const resolved = withResolvedPublicImage(img);
    if (resolved) out[key as keyof typeof out] = resolved;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function withPortalTabloImages(tablos: Tablo[]): Tablo[] {
  return tablos.map((t) => ({
    ...t,
    image: withResolvedPortalImage(t.image),
    framedImage: withResolvedPortalImage(t.framedImage ?? null),
    framedImagesByFinish: withResolvedPortalFramedByFinish(t.framedImagesByFinish),
  }));
}

export function withPublicTabloImages(tablos: Tablo[]): Tablo[] {
  return tablos.map((t) => ({
    ...t,
    image: withResolvedPublicImage(t.image),
    framedImage: withResolvedPublicImage(t.framedImage ?? null),
    framedImagesByFinish: withResolvedPublicFramedByFinish(t.framedImagesByFinish),
  }));
}

export type TabloImageSlot = "artwork" | "framed";

export async function uploadTabloImage(
  tabloId: string,
  file: File,
  slot: TabloImageSlot = "artwork",
): Promise<{ image: TabloImage } | { error: string }> {
  const check = validateImageFile(file);
  if (!check.ok) return { error: check.error };

  const filename = sanitizeFilename(file.name);
  const bytes = Buffer.from(await file.arrayBuffer());
  const mode = getStorageMode();

  if (mode === "blob") {
    const pathname = `${TABLO_BLOB_PREFIX}${tabloId}/${slot}/${filename}`;
    try {
      await writeBlob(pathname, bytes, file.type);
      return {
        image: {
          pathname,
          mime: file.type,
          size: file.size,
        },
      };
    } catch {
      return { error: "Could not upload to Blob storage." };
    }
  }

  if (mode === "filesystem") {
    const dir = join(LOCAL_UPLOADS, tabloId, slot);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const diskPath = join(dir, filename);
    writeFileSync(diskPath, bytes);
    const url = `/uploads/tablos/${tabloId}/${slot}/${filename}`;
    return {
      image: {
        url,
        pathname: url,
        mime: file.type,
        size: file.size,
      },
    };
  }

  return { error: "Storage is read-only — attach Blob or use local dev to upload media." };
}

export async function deleteTabloImage(image: TabloImage | null | undefined): Promise<void> {
  if (!image) return;
  const mode = getStorageMode();
  if (mode === "blob" && image.pathname?.startsWith(TABLO_BLOB_PREFIX)) {
    try {
      const { del } = await import("@vercel/blob");
      await del(image.pathname);
    } catch {
      /* best-effort */
    }
    return;
  }
  if (mode === "filesystem" && image.url?.startsWith("/uploads/tablos/")) {
    const diskPath = join(process.cwd(), "public", image.url);
    try {
      if (existsSync(diskPath)) unlinkSync(diskPath);
    } catch {
      /* best-effort */
    }
  }
}

export function isPublicTabloBlobPathname(pathname: string): boolean {
  return pathname.startsWith(TABLO_BLOB_PREFIX);
}
