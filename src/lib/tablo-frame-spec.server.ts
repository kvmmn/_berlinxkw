import "server-only";
import { probeImageDimensions } from "./image-dimensions.server";
import { tabloArtworkImage } from "./tablo-images";
import {
  orientationFromDimensions,
  type TabloOrientation,
} from "./tablo-frame-spec";
import type { Tablo } from "./types";

/** Derive portrait vs landscape from flat artwork pixels (defaults to portrait). */
export async function tabloArtworkOrientation(tablo: Tablo): Promise<TabloOrientation> {
  const artwork = tabloArtworkImage(tablo);
  if (!artwork) return "portrait";
  if (artwork.width && artwork.height && artwork.width > 0 && artwork.height > 0) {
    return orientationFromDimensions(artwork.width, artwork.height);
  }
  if (!artwork.url) return "portrait";
  const dims = await probeImageDimensions(artwork.url, artwork.mime);
  if (!dims) return "portrait";
  return orientationFromDimensions(dims.width, dims.height);
}
