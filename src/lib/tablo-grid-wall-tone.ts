import type { Tablo } from "./types";

/** Default when slug is not in the sampled map. */
export const TABLO_GRID_WALL_TONE_FALLBACK = "#e6ded4";

/**
 * Median border wall RGB from v4 mockups (see scripts/sample-tablo-grid-wall-tones.mjs).
 * Keys are tablo slugs.
 */
export const TABLO_GRID_WALL_TONE_BY_SLUG: Record<string, string> = {
  "berlin-clouds-01": "#dfd6ca",
  "berlin-sunset-2": "#dfd6ca",
  "berlin-sunset-3": "#dcd4c7",
};

export function tabloGridWallTone(tablo: Tablo): string {
  return TABLO_GRID_WALL_TONE_BY_SLUG[tablo.slug] ?? TABLO_GRID_WALL_TONE_FALLBACK;
}
