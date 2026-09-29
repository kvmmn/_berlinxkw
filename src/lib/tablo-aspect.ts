import type { TabloImage } from "./types";

export function aspectRatioFromDimensions(width: number, height: number): string {
  if (width <= 0 || height <= 0) return "3 / 4";
  return `${width} / ${height}`;
}

export function aspectRatioFromImage(
  image: TabloImage | null | undefined,
  fallback = "3 / 4",
): string {
  if (image?.width && image?.height && image.width > 0 && image.height > 0) {
    return aspectRatioFromDimensions(image.width, image.height);
  }
  return fallback;
}

/** Typical new mockup sizes when dimensions are not yet stored. */
export const MOCKUP_FALLBACK_LANDSCAPE = "2400 / 1790";
export const MOCKUP_FALLBACK_PORTRAIT = "1790 / 2400";
