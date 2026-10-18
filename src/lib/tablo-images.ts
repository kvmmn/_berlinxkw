import type { FrameFinish } from "./types";
import { tabloDefaultFrameFinish } from "./frame-finish";
import { tabloMiniFramedImagePath } from "./tablo-mini-images";
import type { TabloShopSizeId } from "./tablo-sizes";
import type { Tablo, TabloImage } from "./types";

/** Artwork (flat original) — stored on `image` for backward compatibility. */
export function tabloArtworkImage(tablo: Tablo): TabloImage | null {
  return tablo.image ?? null;
}

/** Framed finished sample on wall — optional second image (legacy / fallback for all finishes). */
export function tabloFramedImage(tablo: Tablo): TabloImage | null {
  return tablo.framedImage ?? null;
}

function tabloMiniFramedImage(tablo: Tablo, finish: FrameFinish): TabloImage | null {
  const path = tabloMiniFramedImagePath(tablo.slug, finish);
  if (!path) return null;
  return { url: path, pathname: path, mime: "image/jpeg" };
}

/** Framed mockup for finish and size (mini uses static `/shop-mini` assets when available). */
export function tabloFramedImageForFinishAndSize(
  tablo: Tablo,
  finish?: FrameFinish,
  size: TabloShopSizeId = "large",
): TabloImage | null {
  const key = finish ?? tabloDefaultFrameFinish(tablo);
  if (size === "mini") {
    return tabloMiniFramedImage(tablo, key);
  }
  const perFinish = tablo.framedImagesByFinish?.[key];
  if (perFinish) return perFinish;
  return tabloFramedImage(tablo);
}

/** Framed mockup for a specific finish, or shared `framedImage` when no per-finish asset exists. */
export function tabloFramedImageForFinish(tablo: Tablo, finish?: FrameFinish): TabloImage | null {
  return tabloFramedImageForFinishAndSize(tablo, finish, "large");
}

/** Primary shop/hero image: framed mockup (default finish), else flat artwork. */
export function tabloProductImage(
  tablo: Tablo,
  finish?: FrameFinish,
  size: TabloShopSizeId = "large",
): TabloImage | null {
  const framed = tabloFramedImageForFinishAndSize(tablo, finish, size);
  if (framed) return framed;
  return tabloArtworkImage(tablo);
}

/** Detail gallery: framed mockup first, then flat artwork when both exist. */
export function tabloDetailGalleryImages(
  tablo: Tablo,
  finish?: FrameFinish,
  size: TabloShopSizeId = "large",
): TabloImage[] {
  const artwork = tabloArtworkImage(tablo);
  const framed = tabloFramedImageForFinishAndSize(tablo, finish, size);
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
