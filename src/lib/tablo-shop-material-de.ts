import type { TabloOrientation } from "./tablo-frame-spec";
import type { TabloShopSizeId } from "./types";
import { tabloSizeFrameLabel } from "./tablo-sizes";

/** Quiet Impressum-style material line for public product specs (German only). */
export function tabloSizeMaterialLineDe(
  sizeId: TabloShopSizeId,
  orientation: TabloOrientation,
): string {
  const dims = tabloSizeFrameLabel(sizeId, orientation);
  const mat = sizeId === "large" ? "mit Passepartout" : "ohne Passepartout";
  return `Messingrahmen, ${mat}, ${dims}`;
}
