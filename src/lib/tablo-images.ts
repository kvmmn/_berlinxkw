import type { Tablo, TabloImage } from "./types";

/** Artwork is stored on `image` for backward compatibility. */
export function tabloArtwork(tablo: Tablo): TabloImage | null {
  return tablo.image ?? null;
}

export function tabloFramed(tablo: Tablo): TabloImage | null {
  return tablo.framedImage ?? null;
}

export type TabloImageRole = "artwork" | "framed";

export interface TabloDisplayImage {
  role: TabloImageRole;
  label: string;
  image: TabloImage;
}

/** Artwork first, then framed — only entries with a stored image. */
export function tabloImagesInOrder(tablo: Tablo): TabloDisplayImage[] {
  const out: TabloDisplayImage[] = [];
  const artwork = tabloArtwork(tablo);
  if (artwork) out.push({ role: "artwork", label: "artwork", image: artwork });
  const framed = tabloFramed(tablo);
  if (framed) out.push({ role: "framed", label: "framed sample", image: framed });
  return out;
}
