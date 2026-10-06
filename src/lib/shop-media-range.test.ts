import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contentRangeHeader, parseByteRange } from "./shop-media-range";

describe("parseByteRange", () => {
  it("parses open-ended ranges", () => {
    const r = parseByteRange("bytes=0-", 1000);
    assert.deepEqual(r, { start: 0, end: 999 });
  });

  it("parses suffix ranges", () => {
    const r = parseByteRange("bytes=-500", 1000);
    assert.deepEqual(r, { start: 500, end: 999 });
  });

  it("returns unsatisfiable when start past size", () => {
    assert.equal(parseByteRange("bytes=2000-", 1000), "unsatisfiable");
  });

  it("builds Content-Range header", () => {
    assert.equal(contentRangeHeader(0, 99, 1000), "bytes 0-99/1000");
  });
});
