import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TABLO_GRID_WALL_TONE_FALLBACK,
  tabloGridStageWall,
  tabloGridStageWallDeltaE,
  tabloGridSharedWallTarget,
} from "./tablo-grid-wall-tone";
import type { Tablo } from "./types";

function tablo(slug: string): Tablo {
  return { slug } as Tablo;
}

describe("tablo-grid-wall-tone", () => {
  it("uses edge gradient colors for known shop slugs", () => {
    const wall = tabloGridStageWall("berlin-clouds-01");
    assert.ok(wall.top.startsWith("#"));
    assert.ok(wall.bottom.startsWith("#"));
  });

  it("falls back for unknown slugs", () => {
    const wall = tabloGridStageWall("unknown");
    assert.equal(wall.top, TABLO_GRID_WALL_TONE_FALLBACK);
  });

  it("keeps neighbouring stage mids within 2 ΔE", () => {
    const d = tabloGridStageWallDeltaE("berlin-clouds-01", "berlin-sunset-2");
    assert.ok(d <= 2.05, `clouds vs sunset2 ΔE ${d}`);
    assert.ok(tabloGridSharedWallTarget().startsWith("#"));
  });
});
