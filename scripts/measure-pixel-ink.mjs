#!/usr/bin/env node
/** Button / footer / finish ink bounds via screenshot pixel scan (full bounds, ink-colored pixels). */
import { chromium } from "playwright";
import { PNG } from "pngjs";

const base = (process.argv[2] || "http://127.0.0.1:3001").replace(/\/$/, "");
const widths = (process.argv[3] || "390,768,1440")
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
  return {
    offsetPx: inkCenter - boxCenter,
    absOffsetPx: Math.abs(inkCenter - boxCenter),
    inkTop: box.y + top,
    inkBottom: box.y + bottom,
  };
}

async function measureButton(page, selector) {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await el.waitFor({ state: "visible", timeout: 60000 });
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

async function measureFooter(page) {
  const bar = page.locator(".bk-public-footer-bar").first();
  await bar.scrollIntoViewIfNeeded();
  const note = page.locator(".bk-public-footer-note").first();
  const link = page.locator(".bk-public-footer-advisor").first();
  const noteBox = await note.boundingBox();
  const linkBox = await link.boundingBox();
  const noteShot = await note.screenshot();
  const noteInk = inkOffsetFromScreenshot(noteShot, noteBox, [107, 107, 102], 45);
  const markShot = await link.locator(".bk-public-advisor-mark").screenshot();
  const markBox = await link.locator(".bk-public-advisor-mark").boundingBox();
  const markInk = inkOffsetFromScreenshot(markShot, markBox, [20, 20, 18], 45);
  const footShot = await link.screenshot();
  const png = PNG.sync.read(footShot);
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
  const noteCenter = noteBox.y + noteBox.height / 2;
  const markCenter =
    markInk.inkTop != null && markInk.inkBottom != null
      ? (markInk.inkTop + markInk.inkBottom) / 2
      : markBox.y + markBox.height / 2;
  return {
    noteInkOffsetPx: noteInk.offsetPx,
    markVsNoteCenterPx: markCenter - noteCenter,
    absMarkVsNoteCenterPx: Math.abs(markCenter - noteCenter),
    shellRight: (await page.locator(".bk-public-footer .bk-public-shell").first().boundingBox()).x +
      (await page.locator(".bk-public-footer .bk-public-shell").first().boundingBox()).width,
    linkRight: contentRight,
    pathRight,
    inkInsetFromContentRight: contentRight - pathRight,
    chipCenterX: linkBox.x + linkBox.width / 2,
    markInkCenterX: markBox.x + (markShot ? PNG.sync.read(markShot).width / 2 : 0),
  };
}

async function measureFinishEnglishLabel(page) {
  const row = page.locator(".bk-frame-finish-fieldset--shop .bk-frame-finish-option").first();
  await row.waitFor({ state: "visible" });
  const radio = row.locator('input[type="radio"]');
  const labelEn = row.locator(".bk-frame-finish-label > span").first();
  const radioBox = await radio.boundingBox();
  const labelShot = await labelEn.screenshot();
  const labelBox = await labelEn.boundingBox();
  const inkRgb = await labelEn.evaluate((node) => {
    const cs = getComputedStyle(node);
    const m = cs.color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return [20, 20, 18];
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  });
  const ink = inkOffsetFromScreenshot(labelShot, labelBox, inkRgb);
  const radioCenterY = radioBox.y + radioBox.height / 2;
  const labelInkCenterY =
    ink.inkTop != null && ink.inkBottom != null ? (ink.inkTop + ink.inkBottom) / 2 : null;
  return {
    labelVsRadioCenterPx: labelInkCenterY != null ? labelInkCenterY - radioCenterY : null,
    absLabelVsRadioCenterPx:
      labelInkCenterY != null ? Math.abs(labelInkCenterY - radioCenterY) : null,
  };
}

async function measureAtWidth(browser, width) {
  const report = { width, buttons: {}, footer: null, finishLabel: null };

  const shop = await browser.newPage();
  await shop.setViewportSize({ width, height: 900 });
  await shop.goto(pageUrl("/shop"), { waitUntil: "networkidle", timeout: 120000 });
  report.buttons.shopBuy = await measureButton(shop, ".bk-tablo-buy");
  report.footer = await measureFooter(shop);
  await shop.close();

  const home = await browser.newPage();
  await home.setViewportSize({ width, height: 900 });
  await home.goto(pageUrl("/"), { waitUntil: "networkidle", timeout: 120000 });
  report.buttons.viewShop = await measureButton(home, ".bk-landing-actions .bk-btn-primary");
  report.buttons.instagram = await measureButton(home, ".bk-landing-actions .bk-btn:not(.bk-btn-primary)");
  await home.close();

  const detail = await browser.newPage();
  await detail.setViewportSize({ width, height: 1200 });
  await detail.goto(pageUrl("/shop/berlin-sunset-03"), { waitUntil: "networkidle", timeout: 120000 });
  report.buttons.detailBuy = await measureButton(detail, ".bk-tablo-buy-lg");
  report.finishLabel = await measureFinishEnglishLabel(detail);
  await detail.close();

  const nf = await browser.newPage();
  await nf.setViewportSize({ width, height: 900 });
  await nf.goto(pageUrl("/this-route-does-not-exist-404-test"), {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  report.buttons.notFoundShop = await measureButton(nf, ".bk-landing-actions .bk-btn-primary");
  report.buttons.notFoundHome = await measureButton(nf, ".bk-landing-actions .bk-btn:not(.bk-btn-primary)");
  await nf.close();

  return report;
}

async function main() {
  const browser = await chromium.launch();
  const out = [];
  for (const w of widths) {
    out.push(await measureAtWidth(browser, w));
  }
  await browser.close();
  console.log(JSON.stringify({ base, widths, measurements: out }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
