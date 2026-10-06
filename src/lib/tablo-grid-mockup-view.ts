import {
  TABLO_GRID_MOCKUP_FRAME_FRAC,
  TABLO_GRID_STAGE_MARGIN_RATIO,
  type TabloOrientation,
} from "./tablo-frame-spec";

export { TABLO_GRID_MOCKUP_FRAME_FRAC, TABLO_GRID_STAGE_MARGIN_RATIO };

export function tabloGridMockupFrameFrac(orientation: TabloOrientation): {
  w: number;
  h: number;
} {
  return TABLO_GRID_MOCKUP_FRAME_FRAC[orientation];
}
