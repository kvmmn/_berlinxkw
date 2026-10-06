import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TABLO_GRID_MOCKUP_FRAME_FRAC,
  TABLO_GRID_STAGE_MARGIN_RATIO,
  tabloGridMockupFrameFrac,
} from "./tablo-grid-mockup-view";

describe("tablo-grid-mockup-view", () => {
  it("exposes v4 bronze frame fractions", () => {
    assert.ok(TABLO_GRID_MOCKUP_FRAME_FRAC.landscape.w > 0.65);
    assert.ok(TABLO_GRID_MOCKUP_FRAME_FRAC.portrait.h > 0.6);
    assert.equal(tabloGridMockupFrameFrac("landscape").w, TABLO_GRID_MOCKUP_FRAME_FRAC.landscape.w);
  });

  it("uses a generous stage margin ratio", () => {
    assert.ok(TABLO_GRID_STAGE_MARGIN_RATIO >= 0.08 && TABLO_GRID_STAGE_MARGIN_RATIO <= 0.14);
  });
});
