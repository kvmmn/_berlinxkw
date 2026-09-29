import { tabloArtworkOrientation } from "./tablo-frame-spec.server";
import {
  tabloArtworkAspect,
  tabloFramedSlotAspect,
  tabloProductAspect,
} from "./tablo-aspect.server";
import type { TabloOrientation } from "./tablo-frame-spec";
import type { Tablo } from "./types";

export type TabloWithLayout = {
  tablo: Tablo;
  orientation: TabloOrientation;
  productAspect: string;
  artworkAspect: string;
  framedSlotAspect: string;
};

export async function tablosWithLayout(tablos: Tablo[]): Promise<TabloWithLayout[]> {
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
export async function tablosWithOrientation(tablos: Tablo[]) {
  return tablosWithLayout(tablos);
}
