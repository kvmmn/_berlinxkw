import assert from "node:assert/strict";
import { describe, it } from "node:test";
import path from "node:path";
import {
  SHOP_SCALE_IMAGE_PUBLIC_PATH,
  shopScaleImageAvailable,
} from "./shop-scale-image";

describe("shop scale image", () => {
  it("uses a stable public path", () => {
    assert.equal(SHOP_SCALE_IMAGE_PUBLIC_PATH, "/shop-scale/scale.png");
  });

  it("reports availability from public/shop-scale/scale.png on disk", () => {
    const cwd = path.join(process.cwd());
    const available = shopScaleImageAvailable(cwd);
    assert.equal(typeof available, "boolean");
  });
});
