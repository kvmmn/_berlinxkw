import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeDescriptionSegment } from "../components/TabloDescription";

describe("TabloDescription", () => {
  it("keeps +€ on one line with a non-breaking space", () => {
    assert.equal(
      normalizeDescriptionSegment("Shipping +€10 to the EU"),
      "Shipping +\u00a0€10 to the EU",
    );
  });
});
