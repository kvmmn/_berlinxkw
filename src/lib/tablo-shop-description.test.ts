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

  it("collapses empty middot segments after Persian removal (Berlin Sunsets blob)", () => {
    const raw =
      "Berlin Sunsets · غروب‌های برلین · berlin × kawe. Original photo · Neon study on glass.";
    assert.equal(sanitizeTabloDescriptionForShop(raw), "Berlin Sunsets · berlin × kawe.");
  });

  it("strips legacy spec, finishes, price, and shipping after Original photo marker", () => {
    const raw =
      "Berlin Sunsets · غروب‌های برلین · berlin × kawe. Original photo · 30×45 cm fine-art print · handmade 50×70 cm metal frame with wide mat · brass, matte black or brushed steel · €149 · Free shipping in Germany · Neon study on glass.";
    assert.equal(sanitizeTabloDescriptionForShop(raw), "Berlin Sunsets · berlin × kawe.");
  });

  it("returns empty when only commerce segments remain after marker", () => {
    const raw =
      "Original photo · 30×45 cm fine-art print · handmade 50×70 cm · brass, matte black or brushed steel · €149 · Free shipping in Germany";
    assert.equal(sanitizeTabloDescriptionForShop(raw), "");
  });
});
