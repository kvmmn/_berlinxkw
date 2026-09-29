#!/usr/bin/env node
/** Local-only five-tablo layout proof via scripts/fixtures/gallery-five-tablos.html (not deployed). */
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = process.argv[2] || "/opt/cursor/artifacts/screenshots/fix-forward/after";
const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(__dirname, "fixtures/gallery-five-tablos.html");

async function measureDeadGap(page) {
  return page.evaluate(() => {
    const grid = document.querySelector(".bk-tablo-justified-gallery");
    if (!grid) return null;
    const gap = Number.parseFloat(getComputedStyle(grid).gap) || 0;
    const gr = grid.getBoundingClientRect();
    let maxDead = 0;
    let maxRight = 0;
    for (const li of grid.querySelectorAll(":scope > .bk-tablo-justified-cell")) {
      maxRight = Math.max(maxRight, li.getBoundingClientRect().right);
      const frame = li.querySelector(".bk-aspect-frame");
      const img = li.querySelector("img");
      if (!frame || !img) continue;
      const fr = frame.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      maxDead = Math.max(
        maxDead,
        Math.max(0, fr.bottom - ir.bottom),
        Math.max(0, ir.top - fr.top),
        Math.max(0, fr.right - ir.right, ir.left - fr.left),
      );
    }
    return { gap, maxDead, trailingDead: Math.max(0, gr.right - maxRight) };
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const html = await readFile(fixturePath, "utf8");
  const browser = await chromium.launch();
  for (const w of [768, 1024, 1440]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: 1400 });
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForTimeout(100);
    const m = await measureDeadGap(page);
    console.log(w, m);
    await page.screenshot({ path: join(outDir, `gallery-five-fixture-${w}.png`), fullPage: true });
    await page.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
