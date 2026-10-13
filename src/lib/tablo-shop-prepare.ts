import { normalizeTabloFrameFields } from "./frame-finish";
import type { Tablo } from "./types";

export function prepareShopTablo(tablo: Tablo): Tablo {
  return normalizeTabloFrameFields(tablo);
}

export function prepareShopTablos(tablos: Tablo[]): Tablo[] {
  return tablos.map(prepareShopTablo);
}
