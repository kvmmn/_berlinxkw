import type { FrameFinish } from "./types";
import { tabloDefaultFrameFinish } from "./frame-finish";
import type { Tablo, TabloImage } from "./types";

/** Artwork (flat original) — stored on `image` for backward compatibility. */
export function tabloArtworkImage(tablo: Tablo): TabloImage | null {
  return tablo.image ?? null;
}

/** Framed finished sample on wall — optional second image (legacy / fallback for all finishes). */
export function tabloFramedImage(tablo: Tablo): TabloImage | null {
  return tablo.framedImage ?? null;
}

/** Framed mockup for a specific finish, or shared `framedImage` when no per-finish asset exists. */
export function tabloFramedImageForFinish(tablo: Tablo, finish?: FrameFinish): TabloImage | null {
  const key = finish ?? tabloDefaultFrameFinish(tablo);
  const perFinish = tablo.framedImagesByFinish?.[key];
  if (perFinish) return perFinish;
  return tabloFramedImage(tablo);
}

/** Artwork first, then framed for the given finish when present. */
export function tabloGalleryImages(tablo: Tablo, finish?: FrameFinish): TabloImage[] {
  const out: TabloImage[] = [];
  const artwork = tabloArtworkImage(tablo);
  if (artwork) out.push(artwork);
  const framed = tabloFramedImageForFinish(tablo, finish);
  if (framed) out.push(framed);
  return out;
}
