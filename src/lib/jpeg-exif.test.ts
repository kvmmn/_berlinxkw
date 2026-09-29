import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  jpegDimensionsFromBuffer,
  jpegExifOrientationFromBuffer,
} from "./instagram/jpeg-dimensions";

describe("jpeg EXIF orientation", () => {
  it("reads orientation tag 6 from APP1 Exif", () => {
    const buf = Buffer.alloc(512);
    buf[0] = 0xff;
    buf[1] = 0xd8;
    // APP1
    buf[2] = 0xff;
    buf[3] = 0xe1;
    buf.writeUInt16BE(72, 4);
    buf.write("Exif\0\0", 6);
    const tiff = 12;
    buf.write("II", tiff);
    buf.writeUInt16LE(42, tiff + 2);
    buf.writeUInt32LE(8, tiff + 4);
    const ifd = tiff + 8;
    buf.writeUInt16LE(1, ifd);
    buf.writeUInt16LE(0x0112, ifd + 2);
    buf.writeUInt16LE(3, ifd + 4);
    buf.writeUInt32LE(1, ifd + 6);
    buf.writeUInt16LE(6, ifd + 10);
    assert.equal(jpegExifOrientationFromBuffer(buf), 6);
  });

  it("swaps SOF dimensions when orientation is 6 (4032×3024 → portrait)", () => {
    const buf = Buffer.alloc(512);
    buf[0] = 0xff;
    buf[1] = 0xd8;
    buf[2] = 0xff;
    buf[3] = 0xe1;
    buf.writeUInt16BE(72, 4);
    buf.write("Exif\0\0", 6);
    const tiff = 12;
    buf.write("II", tiff);
    buf.writeUInt16LE(42, tiff + 2);
    buf.writeUInt32LE(8, tiff + 4);
    const ifd = tiff + 8;
    buf.writeUInt16LE(1, ifd);
    buf.writeUInt16LE(0x0112, ifd + 2);
    buf.writeUInt16LE(3, ifd + 4);
    buf.writeUInt32LE(1, ifd + 6);
    buf.writeUInt16LE(6, ifd + 10);
    const sof = 2 + 2 + 72;
    buf[sof] = 0xff;
    buf[sof + 1] = 0xc0;
    buf.writeUInt16BE(17, sof + 2);
    buf.writeUInt16BE(3024, sof + 5);
    buf.writeUInt16BE(4032, sof + 7);
    const dims = jpegDimensionsFromBuffer(buf);
    assert.deepEqual(dims, { width: 3024, height: 4032 });
  });
});
