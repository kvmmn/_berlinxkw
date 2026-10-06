#!/usr/bin/env node
/**
 * Measure rendered bronze frame size (px) and px/cm on /shop grid tiles.
 * Usage: VERCEL_SHARE=… node scripts/measure-grid-frame-scale.mjs <baseUrl> [widths=1440,390]
 */
import { chromium } from "playwright";
import { PNG } from "pngjs";

const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
const widths = (process.argv[3] || "1440,390")
  .split(",")
  .map((s) => Number.parseInt(s.trim(), 10))
  .filter((n) => Number.isFinite(n));
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
  return {
    fw: right - left + 1,
    fh: bottom - top + 1,
  };
}

function parseFrameCm(metaText) {
  const m = metaText.match(/(\d+)×(\d+)\s*cm/i);
  if (!m) return null;
  return { w: Number(m[1]), h: Number(m[2]) };
}

async function measureViewport(page, viewportWidth) {
  await page.setViewportSize({ width: viewportWidth, height: 1200 });
  await page.goto(pageUrl("/shop"), { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForSelector(".bk-tablo-tile", { timeout: 60000 });
  const tiles = page.locator(".bk-tablo-tile");
  const count = await tiles.count();
  const rows = [];
  for (let i = 0; i < count; i++) {
    const tile = tiles.nth(i);
    const title = (await tile.locator(".bk-tablo-tile-title").innerText()).trim();
    const meta = (await tile.locator(".bk-tablo-tile-meta").innerText()).trim();
    const cm = parseFrameCm(meta);
    const media = tile.locator(".bk-tablo-tile-media").first();
    await media.scrollIntoViewIfNeeded();
    const shot = await media.screenshot();
    const bounds = bronzeBoundsInPng(shot);
    if (bounds.error) {
      rows.push({ title, meta, error: bounds.error });
      continue;
    }
    const pxPerCmW = cm ? bounds.fw / cm.w : null;
    const pxPerCmH = cm ? bounds.fh / cm.h : null;
    const longEdgePx = cm && cm.w === 70 && cm.h === 50 ? bounds.fw : bounds.fh;
    const pxPerCmLong = cm ? longEdgePx / 70 : null;
    rows.push({
      title,
      meta,
      framePxW: bounds.fw,
      framePxH: bounds.fh,
      cmW: cm?.w,
      cmH: cm?.h,
      pxPerCmW: pxPerCmW != null ? Math.round(pxPerCmW * 100) / 100 : null,
      pxPerCmH: pxPerCmH != null ? Math.round(pxPerCmH * 100) / 100 : null,
      pxPerCmLong: pxPerCmLong != null ? Math.round(pxPerCmLong * 100) / 100 : null,
    });
  }
  return rows;
}

async function main() {
  const report = { base, widths: {} };
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const w of widths) {
    report.widths[String(w)] = await measureViewport(page, w);
  }
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
