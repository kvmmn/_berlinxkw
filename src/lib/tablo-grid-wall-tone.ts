import wallConfig from "./tablo-grid-wall-config.json";
import { deltaE76, hexToRgb, meanRgb } from "./tablo-grid-wall-color";
import type { Tablo } from "./types";
import type { CSSProperties } from "react";

/** Default when slug is not in the sampled map. */
export const TABLO_GRID_WALL_TONE_FALLBACK = "#e6ded4";

export type TabloGridStageWall = {
  top: string;
  bottom: string;
  left: string;
  right: string;
  horizontalBlend: boolean;
  mockupFilter?: string;
};

const BY_SLUG = new Map(wallConfig.items.map((item) => [item.slug, item]));

export function tabloGridStageWall(slug: string): TabloGridStageWall {
  const item = BY_SLUG.get(slug);
  if (!item) {
    const flat = TABLO_GRID_WALL_TONE_FALLBACK;
    return {
      top: flat,
      bottom: flat,
      left: flat,
      right: flat,
      horizontalBlend: false,
    };
  }
  return item;
}

/** @deprecated Use tabloGridStageStyle */
export function tabloGridWallTone(tablo: Tablo): string {
  const wall = tabloGridStageWall(tablo.slug);
  return wall.top;
}

export function tabloGridStageBackground(wall: TabloGridStageWall): string {
  if (wall.horizontalBlend) {
    return `linear-gradient(to right, ${wall.left}, ${wall.right}), linear-gradient(to bottom, ${wall.top}, ${wall.bottom})`;
  }
  return `linear-gradient(to bottom, ${wall.top}, ${wall.bottom})`;
}

export function tabloGridStageStyle(tablo: Tablo): CSSProperties {
  const wall = tabloGridStageWall(tablo.slug);
  const style: CSSProperties = {
    background: tabloGridStageBackground(wall),
  };
  if (wall.horizontalBlend) {
    style.backgroundBlendMode = "multiply";
  }
  if (wall.mockupFilter) {
    (style as Record<string, string>)["--bk-grid-mockup-filter"] = wall.mockupFilter;
  }
  return style;
}

/** Mid-tone Lab ΔE between two slugs (for QA). */
export function tabloGridStageWallDeltaE(slugA: string, slugB: string): number {
  const a = tabloGridStageWall(slugA);
  const b = tabloGridStageWall(slugB);
  const midA = meanRgb([hexToRgb(a.top), hexToRgb(a.bottom)]);
  const midB = meanRgb([hexToRgb(b.top), hexToRgb(b.bottom)]);
  return deltaE76(midA, midB);
}

export function tabloGridSharedWallTarget(): string {
  return wallConfig.target;
}
