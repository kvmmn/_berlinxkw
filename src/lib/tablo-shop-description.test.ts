import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeTabloDescriptionForShop } from "./tablo-shop-description";

describe("sanitizeTabloDescriptionForShop", () => {
  it("keeps narrative before Original photo and drops commerce segments", () => {
    const raw =
      "€149 · 70×50 cm metal frame with wide mat · Free shipping in Germany · Original photo · Neon study on glass.";
    assert.equal(sanitizeTabloDescriptionForShop(raw), "Neon study on glass.");
  });

  it("strips commerce segments when marker is missing", () => {
    const raw = "€149 · 70×50 cm metal frame · Artist note about the bridge.";
    assert.equal(sanitizeTabloDescriptionForShop(raw), "Artist note about the bridge.");
  });

  it("returns trimmed empty-safe input", () => {
    assert.equal(sanitizeTabloDescriptionForShop(""), "");
  });

  it("strips Persian script from public copy", () => {
    const raw = "Neon study · توضیح فارسی · glass print.";
    assert.equal(sanitizeTabloDescriptionForShop(raw), "Neon study · glass print.");
  });
});
