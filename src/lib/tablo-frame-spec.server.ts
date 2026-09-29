import "server-only";
import { probeTabloImageDimensions } from "./image-dimensions.server";
import { tabloArtworkImage } from "./tablo-images";
import { orientationFromDimensions, type TabloOrientation } from "./tablo-frame-spec";
import type { Tablo } from "./types";

/** Derive portrait vs landscape from flat artwork pixels (defaults to portrait). */
export async function tabloArtworkOrientation(tablo: Tablo): Promise<TabloOrientation> {
  const artwork = tabloArtworkImage(tablo);
  if (!artwork) return "portrait";
  const dims = await probeTabloImageDimensions(artwork);
  if (!dims) return "portrait";
  return orientationFromDimensions(dims.width, dims.height);
}
