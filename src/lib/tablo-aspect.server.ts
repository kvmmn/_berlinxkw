import "server-only";
import { probeTabloImageDimensions } from "./image-dimensions.server";
import {
  aspectRatioFromDimensions,
  MOCKUP_FALLBACK_LANDSCAPE,
  MOCKUP_FALLBACK_PORTRAIT,
} from "./tablo-aspect";
import { tabloArtworkImage, tabloFramedImageForFinish, tabloProductImage } from "./tablo-images";
import { FRAME_FINISHES, tabloDefaultFrameFinish } from "./frame-finish";
import { orientationFromDimensions } from "./tablo-frame-spec";
import type { Tablo, TabloImage } from "./types";

async function imageAspect(image: TabloImage | null | undefined, fallback: string): Promise<string> {
  if (!image) return fallback;
  if (image.width && image.height) {
    return aspectRatioFromDimensions(image.width, image.height);
  }
  const dims = await probeTabloImageDimensions(image);
  if (dims) return aspectRatioFromDimensions(dims.width, dims.height);
  return fallback;
}

export async function tabloArtworkAspect(tablo: Tablo): Promise<string> {
  const artwork = tabloArtworkImage(tablo);
  const dims = artwork ? await probeTabloImageDimensions(artwork) : null;
  const fallback =
    dims && orientationFromDimensions(dims.width, dims.height) === "landscape"
      ? MOCKUP_FALLBACK_LANDSCAPE
      : MOCKUP_FALLBACK_PORTRAIT;
  return imageAspect(artwork, fallback);
}

export async function tabloProductAspect(tablo: Tablo): Promise<string> {
  const product = tabloProductImage(tablo, tabloDefaultFrameFinish(tablo));
  const artwork = tabloArtworkImage(tablo);
  const artDims = artwork ? await probeTabloImageDimensions(artwork) : null;
  const fallback =
    artDims && orientationFromDimensions(artDims.width, artDims.height) === "landscape"
      ? MOCKUP_FALLBACK_LANDSCAPE
      : MOCKUP_FALLBACK_PORTRAIT;
  return imageAspect(product, fallback);
}

/** Shared framed slot ratio for all finishes on a tablo (zero layout shift). */
export async function tabloFramedSlotAspect(tablo: Tablo): Promise<string> {
  const framedCandidates = FRAME_FINISHES.map((finish) => tabloFramedImageForFinish(tablo, finish)).filter(
    (img): img is TabloImage => Boolean(img),
  );
  const framed = framedCandidates[0] ?? tabloFramedImageForFinish(tablo, tabloDefaultFrameFinish(tablo));
  const artwork = tabloArtworkImage(tablo);
  const artDims = artwork ? await probeTabloImageDimensions(artwork) : null;
  const fallback =
    artDims && orientationFromDimensions(artDims.width, artDims.height) === "landscape"
      ? MOCKUP_FALLBACK_LANDSCAPE
      : MOCKUP_FALLBACK_PORTRAIT;
  return imageAspect(framed ?? productFallbackImage(tablo), fallback);
}

function productFallbackImage(tablo: Tablo): TabloImage | null {
  return tabloProductImage(tablo, tabloDefaultFrameFinish(tablo));
}
