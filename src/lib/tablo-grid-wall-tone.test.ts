import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TABLO_GRID_WALL_TONE_BY_SLUG,
  TABLO_GRID_WALL_TONE_FALLBACK,
  tabloGridWallTone,
} from "./tablo-grid-wall-tone";
import type { Tablo } from "./types";

function tablo(slug: string): Tablo {
  return { slug } as Tablo;
}

describe("tablo-grid-wall-tone", () => {
  it("returns sampled tones for known shop slugs", () => {
    assert.equal(tabloGridWallTone(tablo("berlin-clouds-01")), TABLO_GRID_WALL_TONE_BY_SLUG["berlin-clouds-01"]);
  });

  it("falls back for unknown slugs", () => {
    assert.equal(tabloGridWallTone(tablo("unknown")), TABLO_GRID_WALL_TONE_FALLBACK);
  });
});
