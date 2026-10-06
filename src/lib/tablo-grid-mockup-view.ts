import type { TabloOrientation } from "./tablo-frame-spec";

/**
 * Crop mockups to a consistent wall margin around the bronze frame (not the full JPEG).
 * Values derived from production v4 mockups; keeps frame + shadow visible without equalizing row height alone.
 */
export const TABLO_GRID_MOCKUP_VIEW_BOX: Record<TabloOrientation, string> = {
  /** Frame + ~5% margin; aspect 70/50 on 2400×1790 v4 mockups. */
  landscape: "inset(15.36% 12.56% 16.53% 16.31%)",
  /** Frame + ~5% margin; aspect 50/70 on 1790×2400 v4 mockups. */
  portrait: "inset(16.25% 17.65% 16.25% 17.65%)",
};

export function tabloGridMockupViewBox(orientation: TabloOrientation): string {
  return TABLO_GRID_MOCKUP_VIEW_BOX[orientation];
}
