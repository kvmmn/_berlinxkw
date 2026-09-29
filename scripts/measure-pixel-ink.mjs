#!/usr/bin/env node
/** Button / footer ink bounds via screenshot pixel scan (full bounds, ink-colored pixels). */
import { chromium } from "playwright";
import { PNG } from "pngjs";

const base = (process.argv[2] || "http://127.0.0.1:3001").replace(/\/$/, "");
const vercelShare = process.env.VERCEL_SHARE?.trim();
function pageUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!vercelShare) return `${base}${p}`;
  const sep = p.includes("?") ? "&" : "?";
  return `${base}${p}${sep}_vercel_share=${encodeURIComponent(vercelShare)}`;
}

function parseRgb(css) {
  const m = css.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function colorDistance(r, g, b, target) {
  return Math.hypot(r - target[0], g - target[1], b - target[2]);
}

function inkOffsetFromScreenshot(pngBuffer, box, inkRgb, tolerance = 55) {
  const png = PNG.sync.read(pngBuffer);
  const { width, height, data } = png;
  const border = 4;
  let top = height;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x < border || x >= width - border || y < border || y >= height - border) continue;
      const i = (width * y + x) * 4;
      const a = data[i + 3];
      if (a < 48) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (colorDistance(r, g, b, inkRgb) > tolerance) continue;
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (bottom < 0) return { error: "no ink pixels" };
  const inkCenter = box.y + (top + bottom) / 2;
  const boxCenter = box.y + box.height / 2;
  return { offsetPx: inkCenter - boxCenter, inkTop: box.y + top, inkBottom: box.y + bottom };
}

async function measureButton(page, selector) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: "visible" });
  const inkRgb = await el.evaluate((node) => {
    const cs = getComputedStyle(node);
    const m = cs.color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return [0, 0, 0];
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  });
  const box = await el.boundingBox();
  if (!box) return { error: "no box" };
  const shot = await el.screenshot();
  return { selector, box, inkRgb, ...inkOffsetFromScreenshot(shot, box, inkRgb) };
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
      const lum = 0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2];
      if (lum < 140) right = Math.max(right, x);
    }
  }
  const pathRight = linkBox.x + right;
  const contentRight = linkBox.x + linkBox.width;
  return {
    shellRight: shellBox.x + shellBox.width,
    linkRight: contentRight,
    pathRight,
    inkInsetFromContentRight: contentRight - pathRight,
  };
}

async function main() {
  const browser = await chromium.launch();
  const report = { buttons: {}, footer: null };

  const shop = await browser.newPage();
  await shop.setViewportSize({ width: 900, height: 800 });
  await shop.goto(pageUrl("/shop"), { waitUntil: "networkidle", timeout: 120000 });
  report.buttons.shopBuy = await measureButton(shop, ".bk-tablo-buy");
  await shop.close();

  const home = await browser.newPage();
  await home.setViewportSize({ width: 900, height: 800 });
  await home.goto(pageUrl("/"), { waitUntil: "networkidle", timeout: 120000 });
  report.buttons.viewShop = await measureButton(home, ".bk-landing-actions .bk-btn-primary");
  report.buttons.instagram = await measureButton(home, ".bk-landing-actions .bk-btn:not(.bk-btn-primary)");
  await home.close();

  const detail = await browser.newPage();
  await detail.setViewportSize({ width: 900, height: 1200 });
  await detail.goto(pageUrl("/shop/berlin-clouds-01"), { waitUntil: "networkidle", timeout: 120000 });
  report.buttons.detailBuy = await measureButton(detail, ".bk-tablo-buy-lg");
  await detail.close();

  const nf = await browser.newPage();
  await nf.setViewportSize({ width: 900, height: 800 });
  await nf.goto(pageUrl("/this-route-does-not-exist-404-test"), { waitUntil: "networkidle", timeout: 120000 });
  report.buttons.notFoundShop = await measureButton(nf, ".bk-landing-actions .bk-btn-primary");
  report.buttons.notFoundHome = await measureButton(nf, ".bk-landing-actions .bk-btn:not(.bk-btn-primary)");
  await nf.close();

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
