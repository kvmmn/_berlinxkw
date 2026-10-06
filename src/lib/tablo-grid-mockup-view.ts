import type { TabloOrientation } from "./tablo-frame-spec";

/**
 * Crop mockups to a consistent wall margin around the bronze frame (not the full JPEG).
 * Values derived from production v4 mockups; keeps frame + shadow visible without equalizing row height alone.
 */
export const TABLO_GRID_MOCKUP_VIEW_BOX: Record<TabloOrientation, string> = {
  /** Bronze frame + shadow; aspect tuned to 70/50. */
  landscape: "inset(10.6% 7% 10.6% 11.4%)",
  /** Bronze frame + shadow; aspect tuned to 50/70. */
  portrait: "inset(11% 12.7% 11% 12.7%)",
};

export function tabloGridMockupViewBox(orientation: TabloOrientation): string {
  return TABLO_GRID_MOCKUP_VIEW_BOX[orientation];
}
