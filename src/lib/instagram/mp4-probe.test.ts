import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { probeMp4Buffer } from "./mp4-probe";

const FIXTURE = join(process.cwd(), "data/fixtures/instagram/publish-sample.mp4");

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
});
