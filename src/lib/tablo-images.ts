import type { Tablo, TabloImage } from "./types";

/** Artwork (flat original) — stored on `image` for backward compatibility. */
export function tabloArtworkImage(tablo: Tablo): TabloImage | null {
  return tablo.image ?? null;
}

/** Framed finished sample on wall — optional second image. */
export function tabloFramedImage(tablo: Tablo): TabloImage | null {
  return tablo.framedImage ?? null;
}

/** Artwork first, then framed when present. */
export function tabloGalleryImages(tablo: Tablo): TabloImage[] {
  const out: TabloImage[] = [];
  const artwork = tabloArtworkImage(tablo);
  if (artwork) out.push(artwork);
  const framed = tabloFramedImage(tablo);
  if (framed) out.push(framed);
  return out;
}
