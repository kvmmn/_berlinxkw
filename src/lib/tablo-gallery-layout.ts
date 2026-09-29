import { orderTablosForGalleryGrid, type TabloGalleryLayoutItem } from "./tablo-gallery-order";

export type TabloGalleryLayoutPlan = {
  items: TabloGalleryLayoutItem[];
  /** Portrait spans a side rail beside stacked landscapes (no row dead gap). */
  mode: "default" | "portrait-rail";
  portraitTabloId: string | null;
  /** First rail landscape product aspect (width/height) for height sync. */
  railLandscapeAspect: string | null;
};

/**
 * When there is exactly one portrait and two or more landscapes, place the first
 * two landscapes beside a portrait that spans two grid rows (3-col) or stacks
 * in the side rail (2-col). DOM order is always L, L, P, then remaining landscapes.
 */
export function planTabloGalleryLayout<T extends TabloGalleryLayoutItem>(
  items: T[],
): TabloGalleryLayoutPlan {
  const landscapes = items.filter((i) => i.orientation !== "portrait");
  const portraits = items.filter((i) => i.orientation === "portrait");

  if (portraits.length === 1 && landscapes.length >= 2) {
    const portrait = portraits[0]!;
    const ordered = [...landscapes.slice(0, 2), portrait, ...landscapes.slice(2)];
    return {
      items: ordered,
      mode: "portrait-rail",
      portraitTabloId: portrait.tablo.id,
      railLandscapeAspect: landscapes[0]!.productAspect,
    };
  }

  return {
    items: orderTablosForGalleryGrid(items),
    mode: "default",
    portraitTabloId: null,
    railLandscapeAspect: null,
  };
}
