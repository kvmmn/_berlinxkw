#!/usr/bin/env node
/** Button / footer ink bounds via screenshot pixel scan (not getClientRects). */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { PNG } from "pngjs";

const base = (process.argv[2] || "http://127.0.0.1:3001").replace(/\/$/, "");
const vercelShare = process.env.VERCEL_SHARE?.trim();
function pageUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!vercelShare) return `${base}${p}`;
  const sep = p.includes("?") ? "&" : "?";
  return `${base}${p}${sep}_vercel_share=${encodeURIComponent(vercelShare)}`;
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function inkOffsetFromScreenshot(pngBuffer, box, { darkInk = true } = {}) {
  const png = PNG.sync.read(pngBuffer);
  const { width, height, data } = png;
  const yStart = Math.max(0, Math.floor(height * 0.12));
  const yEnd = Math.min(height, Math.ceil(height * 0.88));
  const xStart = Math.max(0, Math.floor(width * 0.15));
  const xEnd = Math.min(width, Math.ceil(width * 0.85));
  let top = height;
  let bottom = -1;
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const i = (width * y + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 32) continue;
      const lum = luminance(r, g, b);
      const isInk = darkInk ? lum < 140 : lum > 200;
      if (!isInk) continue;
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (bottom < 0) return { error: "no ink pixels" };
  const inkCenter = box.y + (top + bottom) / 2;
  const boxCenter = box.y + box.height / 2;
  return { offsetPx: inkCenter - boxCenter, inkTop: box.y + top, inkBottom: box.y + bottom };
}

async function measureButton(page, selector, darkInk) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: "visible" });
  const box = await el.boundingBox();
  if (!box) return { error: "no box" };
  const shot = await el.screenshot();
  return { selector, box, ...inkOffsetFromScreenshot(shot, box, { darkInk }) };
}

async function measureFooterPath(page) {
  const shell = page.locator(".bk-public-footer .bk-public-shell").first();
  const link = page.locator(".bk-public-footer-advisor").first();
  const shellBox = await shell.boundingBox();
  const linkBox = await link.boundingBox();
  const shot = await link.screenshot();
  const png = PNG.sync.read(shot);
  let right = -1;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const i = (png.width * y + x) * 4;
      if (png.data[i + 3] < 32) continue;
      if (luminance(png.data[i], png.data[i + 1], png.data[i + 2]) < 140) {
        right = Math.max(right, x);
      }
    }
  }
  const pathRight = linkBox.x + right;
  return {
    shellRight: shellBox?.x + shellBox?.width,
    linkRight: linkBox.x + linkBox.width,
    pathRight,
    pathDeltaFromShellRight: pathRight - (shellBox.x + shellBox.width),
  };
}

async function main() {
  const browser = await chromium.launch();
  const report = { buttons: {}, footer: null };

  const shop = await browser.newPage();
  await shop.setViewportSize({ width: 900, height: 800 });
  await shop.goto(pageUrl("/shop"), { waitUntil: "networkidle", timeout: 120000 });
  report.buttons.shopBuy = await measureButton(shop, ".bk-tablo-buy", false);
  await shop.close();

  const home = await browser.newPage();
  await home.setViewportSize({ width: 900, height: 800 });
  await home.goto(pageUrl("/"), { waitUntil: "networkidle", timeout: 120000 });
  report.buttons.viewShop = await measureButton(home, ".bk-landing-actions .bk-btn-primary", false);
  report.buttons.instagram = await measureButton(home, ".bk-landing-actions .bk-btn:not(.bk-btn-primary)", true);
  await home.close();

  const detail = await browser.newPage();
  await detail.setViewportSize({ width: 900, height: 1200 });
  await detail.goto(pageUrl("/shop/berlin-clouds-01"), { waitUntil: "networkidle", timeout: 120000 });
  report.buttons.detailBuy = await measureButton(detail, ".bk-tablo-buy-lg", false);
  await detail.close();

  const foot = await browser.newPage();
  await foot.setViewportSize({ width: 1440, height: 400 });
  await foot.goto(pageUrl("/shop"), { waitUntil: "networkidle", timeout: 120000 });
  report.footer = await measureFooterPath(foot);
  await foot.close();

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
