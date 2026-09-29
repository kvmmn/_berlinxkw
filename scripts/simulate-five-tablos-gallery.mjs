#!/usr/bin/env node
/**
 * Opens shop with ?simulateFiveTablos=1 (dev-only query handled in page if present)
 * For measurement, duplicates layout via local storage override — use measure script on
 * a page that renders five items. This script injects five tiles via evaluate for gap proof.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const base = process.argv[2] || "http://127.0.0.1:3001";
const outDir = process.argv[3] || "/opt/cursor/artifacts/screenshots/fix-forward/after";

async function measureDeadGap(page) {
  return page.evaluate(() => {
    const grid = document.querySelector(".bk-tablo-grid");
    if (!grid) return null;
    const gap = Number.parseFloat(getComputedStyle(grid).gap) || 0;
    let maxDead = 0;
    for (const li of grid.querySelectorAll(":scope > li")) {
      const frame = li.querySelector(".bk-aspect-frame");
      const img = li.querySelector(".bk-tablo-picture, img");
      if (!frame || !img) continue;
      const fr = frame.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      maxDead = Math.max(maxDead, Math.max(0, fr.bottom - ir.bottom), Math.max(0, ir.top - fr.top));
    }
    return { gap, maxDead };
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  for (const w of [768, 1440]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: 1400 });
    await page.goto(`${base}/shop?gallerySim5=1`, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(500);
    const m = await measureDeadGap(page);
    console.log(w, m);
    await page.screenshot({ path: join(outDir, `shop-sim5-${w}.png`), fullPage: true });
    await page.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
