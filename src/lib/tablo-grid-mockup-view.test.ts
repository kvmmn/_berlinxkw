import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TABLO_GRID_MOCKUP_VIEW_BOX,
  tabloGridMockupViewBox,
} from "./tablo-grid-mockup-view";
import { frameGridStageAspect } from "./tablo-frame-spec";

function parseInsetPercents(viewBox: string): [number, number, number, number] {
  const m = viewBox.match(/inset\(([^)]+)\)/);
  assert.ok(m, "expected inset() view box");
  const parts = m[1]!.split(/\s+/).map((p) => Number.parseFloat(p.replace("%", "")) / 100);
  assert.equal(parts.length, 4);
  return parts as [number, number, number, number];
}

/** object-view-box inset() percentages are relative to image width (horizontal) and height (vertical). */
function visibleAspect(inset: string, imageW: number, imageH: number): number {
  const [top, right, bottom, left] = parseInsetPercents(inset);
  const visW = imageW * (1 - left - right);
  const visH = imageH * (1 - top - bottom);
  return visW / visH;
}

describe("tablo-grid-mockup-view", () => {
  it("matches catalog frame aspect for v4 mockup dimensions", () => {
    const cases = [
      { orientation: "landscape" as const, w: 2400, h: 1790 },
      { orientation: "portrait" as const, w: 1790, h: 2400 },
    ];
    for (const { orientation, w, h } of cases) {
      const viewBox = tabloGridMockupViewBox(orientation);
      const stageAspect = frameGridStageAspect(orientation);
      const [sw, sh] = stageAspect.split("/").map((s) => Number.parseFloat(s.trim()));
      const target = sw / sh;
      const visible = visibleAspect(viewBox, w, h);
      assert.ok(
        Math.abs(visible - target) < 0.02,
        `${orientation}: visible ${visible} vs stage ${target}`,
      );
    }
  });

  it("exports stable view boxes", () => {
    assert.ok(TABLO_GRID_MOCKUP_VIEW_BOX.landscape.startsWith("inset("));
    assert.ok(TABLO_GRID_MOCKUP_VIEW_BOX.portrait.startsWith("inset("));
  });
});
