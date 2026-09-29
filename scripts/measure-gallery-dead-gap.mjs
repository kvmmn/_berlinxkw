#!/usr/bin/env node
/**
 * Measures largest empty rectangle inside gallery grid media areas (dead gap).
 * Usage: node scripts/measure-gallery-dead-gap.mjs [baseUrl] [pathname]
 */
import { chromium } from "playwright";

const raw = process.argv[2] || "http://127.0.0.1:3001/shop";
const pageUrl = raw.includes("://") && raw.replace(/^https?:\/\/[^/]+/, "").length > 0 ? raw : `${raw.replace(/\/$/, "")}${process.argv[3] || "/shop"}`;
const widths = [360, 390, 768, 1440].map(Number);

async function measureGrid(page) {
  return page.evaluate(() => {
    const grid = document.querySelector(".bk-tablo-grid");
    if (!grid) return { error: "no grid" };
    const gap = Number.parseFloat(getComputedStyle(grid).gap) || 0;
    let maxDead = 0;
    const cells = [];
    for (const li of grid.querySelectorAll(":scope > li")) {
      const frame = li.querySelector(".bk-aspect-frame");
      const img = li.querySelector(".bk-tablo-picture, img");
      if (!frame) continue;
      const fr = frame.getBoundingClientRect();
      const ir = img?.getBoundingClientRect();
      const deadBelow = ir ? Math.max(0, fr.bottom - ir.bottom) : 0;
      const deadAbove = ir ? Math.max(0, ir.top - fr.top) : 0;
      const dead = Math.max(deadBelow, deadAbove);
      maxDead = Math.max(maxDead, dead);
      cells.push({ dead, frameH: fr.height, imgH: ir?.height ?? 0 });
    }
    return { gap, maxDead, cells };
  });
}

async function main() {
  const browser = await chromium.launch();
  const results = [];
  for (const w of widths) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: w === 1440 ? 1400 : 1200 });
    await page.goto(pageUrl, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(400);
    const m = await measureGrid(page);
    results.push({ width: w, ...m });
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
