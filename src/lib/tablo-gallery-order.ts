import type { TabloOrientation } from "./tablo-frame-spec";
import type { Tablo } from "./types";

export type TabloGalleryLayoutItem = {
  tablo: Tablo;
  orientation: TabloOrientation;
  productAspect: string;
  artworkAspect: string;
  framedSlotAspect: string;
};

/**
 * Grid rows share the tallest tile height. Keep landscapes together, then portraits,
 * so a tall portrait never sits beside landscapes (avoids dead whitespace under them).
 * Relative order within each group matches the input (e.g. updatedAt sort).
 */
export function orderTablosForGalleryGrid<T extends TabloGalleryLayoutItem>(items: T[]): T[] {
  const landscapes: T[] = [];
  const portraits: T[] = [];
  for (const item of items) {
    if (item.orientation === "portrait") {
      portraits.push(item);
    } else {
      landscapes.push(item);
    }
  }
  return [...landscapes, ...portraits];
}
