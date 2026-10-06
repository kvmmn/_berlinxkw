import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { probeMp4Buffer } from "./mp4-probe";

const FIXTURE = join(process.cwd(), "data/fixtures/instagram/publish-sample.mp4");
const LANDSCAPE_ROT90 = join(process.cwd(), "data/fixtures/instagram/landscape-rot90-meta.mp4");
const LANDSCAPE_ROT270 = join(process.cwd(), "data/fixtures/instagram/landscape-rot270-meta.mp4");

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

  it("reads display_rotation=90 copy (1280×720 stored → 720×1280 display)", () => {
    const r = probeMp4Buffer(readFileSync(LANDSCAPE_ROT90));
    assert.equal(r.errors.length, 0);
    assert.equal(r.width, 720);
    assert.equal(r.height, 1280);
    assert.ok(r.aspectRatio != null && r.aspectRatio < 1);
  });

  it("reads display_rotation=270 copy as 720×1280 display", () => {
    const r = probeMp4Buffer(readFileSync(LANDSCAPE_ROT270));
    assert.equal(r.errors.length, 0);
    assert.equal(r.width, 720);
    assert.equal(r.height, 1280);
  });
});
