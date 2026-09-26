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

/** Primary shop/hero image: framed mockup (default finish), else flat artwork. */
export function tabloProductImage(tablo: Tablo, finish?: FrameFinish): TabloImage | null {
  const framed = tabloFramedImageForFinish(tablo, finish);
  if (framed) return framed;
  return tabloArtworkImage(tablo);
}

/** Detail gallery: framed mockup first, then flat artwork when both exist. */
export function tabloDetailGalleryImages(tablo: Tablo, finish?: FrameFinish): TabloImage[] {
  const artwork = tabloArtworkImage(tablo);
  const framed = tabloFramedImageForFinish(tablo, finish);
  const out: TabloImage[] = [];
  if (framed) out.push(framed);
  if (artwork && artwork.url !== framed?.url && artwork.pathname !== framed?.pathname) {
    out.push(artwork);
  }
  return out;
}

/** @deprecated Prefer tabloProductImage / tabloDetailGalleryImages for public UI. */
export function tabloGalleryImages(tablo: Tablo, finish?: FrameFinish): TabloImage[] {
  return tabloDetailGalleryImages(tablo, finish);
}
