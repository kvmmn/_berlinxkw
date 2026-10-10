import { normalizeTabloFrameFields } from "./frame-finish";
import { applyTabloImprovisationFields } from "./tablo-improvisation";
import type { Tablo } from "./types";

export function prepareShopTablo(tablo: Tablo): Tablo {
  return applyTabloImprovisationFields(normalizeTabloFrameFields(tablo));
}

export function prepareShopTablos(tablos: Tablo[]): Tablo[] {
  return tablos.map(prepareShopTablo);
}
