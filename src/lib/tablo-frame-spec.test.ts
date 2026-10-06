import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dimensionsFromBuffer } from "./image-dimensions";
import {
  frameGridStageAspect,
  frameGridStageFlexGrow,
  orientationFromDimensions,
} from "./tablo-frame-spec";

describe("frame grid stage", () => {
  it("uses catalog 70×50 cm ratios for shop grid cells", () => {
    assert.equal(frameGridStageAspect("landscape"), "70 / 50");
    assert.equal(frameGridStageAspect("portrait"), "50 / 70");
    assert.equal(frameGridStageFlexGrow("landscape"), 70 / 50);
    assert.equal(frameGridStageFlexGrow("portrait"), 50 / 70);
  });
});

describe("tablo frame orientation", () => {
  it("treats 4032×3024 artwork as landscape", () => {
    assert.equal(orientationFromDimensions(4032, 3024), "landscape");
  });

  it("treats 3024×4032 artwork as portrait", () => {
    assert.equal(orientationFromDimensions(3024, 4032), "portrait");
  });

  it("reads landscape dimensions from a JPEG SOF header buffer", () => {
    // Minimal JPEG with SOF0 width=4032 height=3024 (big-endian in marker).
    const buf = Buffer.alloc(512);
    buf[0] = 0xff;
    buf[1] = 0xd8;
    buf[2] = 0xff;
    buf[3] = 0xc0; // SOF0
    buf[4] = 0x00;
    buf[5] = 0x11;
    buf[6] = 0x08;
    buf.writeUInt16BE(3024, 7); // height
    buf.writeUInt16BE(4032, 9); // width
    const dims = dimensionsFromBuffer(buf, "image/jpeg");
    assert.deepEqual(dims, { width: 4032, height: 3024 });
    assert.equal(orientationFromDimensions(dims!.width, dims!.height), "landscape");
  });
});
