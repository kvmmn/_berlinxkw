import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countHashtags, validateCaption } from "./validate";

describe("validateCaption", () => {
  it("accepts normal captions", () => {
    const r = validateCaption("berlin × kawe #archive");
    assert.equal(r.ok, true);
    assert.equal(r.hashtagCount, 1);
  });

  it("rejects too many hashtags", () => {
    const tags = Array.from({ length: 31 }, (_, i) => `#tag${i}`).join(" ");
    const r = validateCaption(tags);
    assert.equal(r.ok, false);
    assert.equal(r.hashtagCount, 31);
  });

  it("counts unicode hashtags", () => {
    assert.equal(countHashtags("#برلین #berlin"), 2);
  });
});
