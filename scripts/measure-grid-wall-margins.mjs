#!/usr/bin/env node
/**
 * Wall margin (px) between bronze frame and stage inner edge on /shop grid.
 * Usage: VERCEL_SHARE=… node scripts/measure-grid-wall-margins.mjs <baseUrl> [width=1440]
 */
import { chromium } from "playwright";
import { PNG } from "pngjs";

const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
const viewportWidth = Number.parseInt(process.argv[3] || "1440", 10);
const vercelShare = process.env.VERCEL_SHARE?.trim();

function pageUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!vercelShare) return `${base}${p}`;
  const sep = p.includes("?") ? "&" : "?";
  return `${base}${p}${sep}_vercel_share=${encodeURIComponent(vercelShare)}`;
}

function isBronze(r, g, b) {
  return r > 150 && g > 100 && b < 130 && r > g && g > b + 10 && r - g < 80;
}

function bronzeBoundsInPng(pngBuffer) {
  const png = PNG.sync.read(pngBuffer);
  const { width, height, data } = png;
  let top = height;
  let bottom = -1;
  let left = width;
  let right = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (width * y + x) * 4;
      const a = data[i + 3];
      if (a < 48) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (!isBronze(r, g, b)) continue;
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
  }
  if (bottom < 0) return { error: "no bronze pixels" };
  return { top, bottom, left, right, fw: right - left + 1, fh: bottom - top + 1 };
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: viewportWidth, height: 1400 } });
  await page.goto(pageUrl("/shop"), { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForSelector(".bk-tablo-tile-media--frame-stage", { timeout: 60000 });
  const tiles = page.locator(".bk-tablo-tile");
  const count = await tiles.count();
  const rows = [];
  for (let i = 0; i < count; i++) {
    const tile = tiles.nth(i);
    const title = (await tile.locator(".bk-tablo-tile-title").innerText()).trim();
    const media = tile.locator(".bk-tablo-tile-media--frame-stage").first();
    const box = await media.boundingBox();
    const shot = await media.screenshot();
    const b = bronzeBoundsInPng(shot);
    if (b.error || !box) {
      rows.push({ title, error: b.error || "no box" });
      continue;
    }
    const padLeft = await media.evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingLeft) || 0);
    const padTop = await media.evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingTop) || 0);
    const innerW = box.width - padLeft * 2;
    const innerH = box.height - padTop * 2;
    rows.push({
      title,
      marginLeft: Math.round(b.left - padLeft),
      marginRight: Math.round(innerW - (b.right + 1)),
      marginTop: Math.round(b.top - padTop),
      marginBottom: Math.round(innerH - (b.bottom + 1)),
      stagePx: `${Math.round(box.width)}×${Math.round(box.height)}`,
      framePx: `${b.fw}×${b.fh}`,
    });
  }
  await browser.close();
  console.log(JSON.stringify({ base, viewportWidth, tiles: rows }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
