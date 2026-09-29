import { orderTablosForGalleryGrid, type TabloGalleryLayoutItem } from "./tablo-gallery-order";

export type TabloGalleryLayoutPlan = {
  items: TabloGalleryLayoutItem[];
};

/** Order tablos for justified flex rows (landscapes before portraits). */
export function planTabloGalleryLayout<T extends TabloGalleryLayoutItem>(
  items: T[],
): TabloGalleryLayoutPlan {
  return {
    items: orderTablosForGalleryGrid(items),
  };
}
