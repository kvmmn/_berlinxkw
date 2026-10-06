import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TABLO_GRID_WALL_TONE_FALLBACK,
  tabloGridStageWall,
  tabloGridStageWallDeltaE,
  tabloGridSharedWallTarget,
} from "./tablo-grid-wall-tone";
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

  it("keeps sunset stages matched and clouds neighbour within ~3 ΔE", () => {
    const cloudsSunset = tabloGridStageWallDeltaE("berlin-clouds-01", "berlin-sunset-2");
    assert.ok(cloudsSunset <= 3.05, `clouds vs sunset2 ΔE ${cloudsSunset}`);
    const sunsetPair = tabloGridStageWallDeltaE("berlin-sunset-2", "berlin-sunset-3");
    assert.ok(sunsetPair <= 2.05, `sunset2 vs sunset3 ΔE ${sunsetPair}`);
    assert.ok(tabloGridSharedWallTarget().startsWith("#"));
  });
});
