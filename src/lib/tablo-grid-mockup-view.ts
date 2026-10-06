import type { TabloOrientation } from "./tablo-frame-spec";

/** Bronze frame ÷ full JPEG (v4 production mockups). */
export const TABLO_GRID_MOCKUP_FRAME_FRAC = {
  landscape: { w: 1627 / 2400, h: 1228 / 1790 },
  portrait: { w: 1082 / 1790, h: 1541 / 2400 },
} as const;

/** Wall margin around the 70 cm frame edge in desktop grid stages (~10%). */
export const TABLO_GRID_STAGE_MARGIN_RATIO = 0.1;

export function tabloGridMockupFrameFrac(orientation: TabloOrientation): {
  w: number;
  h: number;
} {
  return TABLO_GRID_MOCKUP_FRAME_FRAC[orientation];
}
