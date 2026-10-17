import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tabloHasMiniMockups, tabloMiniFramedImagePath } from "./tablo-mini-images";

describe("tablo mini mockups", () => {
  it("resolves known slug + finish paths", () => {
    assert.equal(tabloHasMiniMockups("berlin-clouds-01"), true);
    assert.equal(
      tabloMiniFramedImagePath("berlin-clouds-01", "bronze"),
      "/shop-mini/berlin-clouds-01/framed-bronze.jpg",
    );
    assert.equal(
      tabloMiniFramedImagePath("berlin-clouds-01", "matte-black-brushed"),
      "/shop-mini/berlin-clouds-01/framed-matte-black-brushed.jpg",
    );
  });

  it("returns undefined for slugs without mini assets", () => {
    assert.equal(tabloHasMiniMockups("unknown-slug"), false);
    assert.equal(tabloMiniFramedImagePath("unknown-slug", "bronze"), undefined);
  });
});
