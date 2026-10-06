import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { probeMp4Buffer } from "./mp4-probe";

const FIXTURE = join(process.cwd(), "data/fixtures/instagram/publish-sample.mp4");
const ROT90 = join(process.cwd(), "data/fixtures/instagram/reel-rot90.mp4");
const ROT270 = join(process.cwd(), "data/fixtures/instagram/reel-rot270.mp4");

describe("probeMp4Buffer", () => {
  it("reads duration and dimensions from fixture MP4", () => {
    const buf = readFileSync(FIXTURE);
    const r = probeMp4Buffer(buf);
    assert.equal(r.errors.length, 0);
    assert.ok(r.durationSec != null && r.durationSec > 0);
    assert.equal(r.width, 320);
    assert.equal(r.height, 240);
    assert.ok(r.aspectRatio != null && r.aspectRatio > 1);
  });

  it("reads transposed ffmpeg reel (720×1280 stored pixels)", () => {
    const r = probeMp4Buffer(readFileSync(ROT90));
    assert.equal(r.errors.length, 0);
    assert.equal(r.width, 720);
    assert.equal(r.height, 1280);
    assert.ok(r.aspectRatio != null && r.aspectRatio < 1);
  });

  it("reads transpose=2 ffmpeg reel as portrait 720×1280", () => {
    const r = probeMp4Buffer(readFileSync(ROT270));
    assert.equal(r.errors.length, 0);
    assert.equal(r.width, 720);
    assert.equal(r.height, 1280);
  });

  it("swaps tkhd stored dimensions when display matrix is 90° (1280×720 → 720×1280)", () => {
    const buf = Buffer.from(readFileSync(FIXTURE));
    function boxEnd(o: number): number {
      let sz = buf.readUInt32BE(o);
      if (sz === 1) sz = Number(buf.readBigUInt64BE(o + 8));
      return o + sz;
    }
    function find(type: string, start: number, end: number): number {
      let o = start;
      while (o + 8 <= end) {
        const t = buf.toString("ascii", o + 4, o + 8);
        if (t === type) return o;
        o = boxEnd(o);
      }
      return -1;
    }
    const moov = find("moov", 0, buf.length);
    const trak = find("trak", moov + 8, boxEnd(moov));
    const tkhd = find("tkhd", trak + 8, boxEnd(trak));
    const matrixStart = tkhd + 48;
    const writeFixed = (off: number, val: number) => buf.writeUInt32BE(Math.round(val * 65536), off);
    writeFixed(matrixStart, 0);
    writeFixed(matrixStart + 4, 1);
    buf.writeInt32BE(-65536, matrixStart + 8);
    writeFixed(matrixStart + 12, 0);
    const r = probeMp4Buffer(buf);
    assert.equal(r.errors.length, 0);
    assert.equal(r.width, 240);
    assert.equal(r.height, 320);
  });
});
