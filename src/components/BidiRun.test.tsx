import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RunFa, RunLtrToken } from "./BidiRun";

describe("BidiRun", () => {
  it("wraps dimension strings in dir=ltr isolated spans inside Persian runs", () => {
    const html = renderToStaticMarkup(
      <RunFa>
        بزرگ — <RunLtrToken>50×70 cm</RunLtrToken>
      </RunFa>,
    );
    assert.match(html, /dir="ltr"[^>]*lang="en"[^>]*>50×70 cm<\/span>/);
    assert.match(html, /dir="rtl"[^>]*lang="fa"/);
  });
});
