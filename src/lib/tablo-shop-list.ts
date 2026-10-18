import { tabloArtworkOrientation } from "./tablo-frame-spec.server";
import {
  tabloArtworkAspect,
  tabloFramedSlotAspect,
  tabloProductAspect,
} from "./tablo-aspect.server";
import type { TabloOrientation } from "./tablo-frame-spec";
import type { ShopTablo } from "./types";

export type TabloWithLayout = {
  tablo: ShopTablo;
  orientation: TabloOrientation;
  productAspect: string;
  artworkAspect: string;
  framedSlotAspect: string;
};

export async function tablosWithLayout(tablos: ShopTablo[]): Promise<TabloWithLayout[]> {
  return Promise.all(
    tablos.map(async (tablo) => ({
      tablo,
      orientation: await tabloArtworkOrientation(tablo),
      productAspect: await tabloProductAspect(tablo),
      artworkAspect: await tabloArtworkAspect(tablo),
      framedSlotAspect: await tabloFramedSlotAspect(tablo),
    })),
  );
}

export { orderTablosForGalleryGrid } from "./tablo-gallery-order";

/** @deprecated Use tablosWithLayout */
export async function tablosWithOrientation(tablos: ShopTablo[]) {
  return tablosWithLayout(tablos);
}
