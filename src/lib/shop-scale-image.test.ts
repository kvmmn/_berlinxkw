import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  SHOP_SCALE_IMAGE_LANDSCAPE_PATH,
  SHOP_SCALE_IMAGE_PORTRAIT_PATH,
  shopScaleImageAltForOrientation,
  shopScaleImagePathForOrientation,
} from "./shop-scale-image";

describe("shop scale image", () => {
  it("uses stable public paths", () => {
    assert.equal(SHOP_SCALE_IMAGE_PORTRAIT_PATH, "/shop-scale/scale.png");
    assert.equal(SHOP_SCALE_IMAGE_LANDSCAPE_PATH, "/shop-scale/scale-landscape.png");
  });

  it("selects portrait vs landscape assets by tablo orientation", () => {
    assert.equal(shopScaleImagePathForOrientation("portrait", process.cwd()), SHOP_SCALE_IMAGE_PORTRAIT_PATH);
    assert.equal(
      shopScaleImagePathForOrientation("landscape", process.cwd()),
      SHOP_SCALE_IMAGE_LANDSCAPE_PATH,
    );
  });

  it("returns undefined when the orientation file is absent", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "shop-scale-"));
    const pub = path.join(tmp, "public", "shop-scale");
    fs.mkdirSync(pub, { recursive: true });
    fs.writeFileSync(path.join(pub, "scale.png"), "x");
    assert.equal(shopScaleImagePathForOrientation("portrait", tmp), SHOP_SCALE_IMAGE_PORTRAIT_PATH);
    assert.equal(shopScaleImagePathForOrientation("landscape", tmp), undefined);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("alt text names portrait or landscape layout", () => {
    assert.match(shopScaleImageAltForOrientation("portrait"), /portrait/i);
    assert.match(shopScaleImageAltForOrientation("landscape"), /landscape/i);
  });
});
