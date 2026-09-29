#!/usr/bin/env node
/** Button / footer / finish ink bounds via screenshot pixel scan (full bounds, ink-colored pixels). */
import { chromium } from "playwright";
import { PNG } from "pngjs";

const base = (process.argv[2] || "http://127.0.0.1:3001").replace(/\/$/, "");
const widths = (process.argv[3] || "360,390,768,1024,1440")
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

function scanInkBounds(pngBuffer, box, inkRgb, tolerance = 55) {
  const png = PNG.sync.read(pngBuffer);
  const { width, height, data } = png;
  const border = 4;
  let top = height;
  let bottom = -1;
  let left = width;
  let right = -1;
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
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
  }
  if (bottom < 0) return { error: "no ink pixels" };
  return {
    inkTop: box.y + top,
    inkBottom: box.y + bottom,
    inkLeft: box.x + left,
    inkRight: box.x + right,
    inkCenterY: box.y + (top + bottom) / 2,
    inkCenterX: box.x + (left + right) / 2,
  };
}

function inkOffsetFromScreenshot(pngBuffer, box, inkRgb, tolerance = 55) {
  const b = scanInkBounds(pngBuffer, box, inkRgb, tolerance);
  if (b.error) return b;
  const boxCenter = box.y + box.height / 2;
  return {
    offsetPx: b.inkCenterY - boxCenter,
    absOffsetPx: Math.abs(b.inkCenterY - boxCenter),
    inkTop: b.inkTop,
    inkBottom: b.inkBottom,
    inkCenterY: b.inkCenterY,
    inkCenterX: b.inkCenterX,
    inkLeft: b.inkLeft,
    inkRight: b.inkRight,
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
  const shell = page.locator(".bk-public-footer .bk-public-shell").first();
  await shell.scrollIntoViewIfNeeded();
  const shellBox = await shell.boundingBox();
  const gutterRight = await shell.evaluate((node) => {
    const cs = getComputedStyle(node);
    return Number.parseFloat(cs.paddingRight) || 0;
  });
  const contentRight = shellBox.x + shellBox.width - gutterRight;

  const note = page.locator(".bk-public-footer-note").first();
  const link = page.locator(".bk-public-footer-advisor").first();
  const noteBox = await note.boundingBox();
  const linkBox = await link.boundingBox();
  const noteShot = await note.screenshot();
  const noteInk = scanInkBounds(noteShot, noteBox, [107, 107, 102], 45);

  const mark = link.locator(".bk-public-advisor-mark");
  const markBox = await mark.boundingBox();
  const markShot = await mark.screenshot();
  const markInk = scanInkBounds(markShot, markBox, [20, 20, 18], 50);

  await link.hover();
  await page.waitForTimeout(120);
  const linkBoxHover = await link.boundingBox();

  const noteInkCenterY =
    noteInk.inkCenterY ??
    (noteInk.inkTop != null ? (noteInk.inkTop + noteInk.inkBottom) / 2 : noteBox.y + noteBox.height / 2);
  const markInkCenterY =
    markInk.inkCenterY ??
    (markInk.inkTop != null ? (markInk.inkTop + markInk.inkBottom) / 2 : markBox.y + markBox.height / 2);
  const markInkCenterX =
    markInk.inkCenterX ??
    (markInk.inkLeft != null ? (markInk.inkLeft + markInk.inkRight) / 2 : markBox.x + markBox.width / 2);

  const chipCenterX = linkBoxHover.x + linkBoxHover.width / 2;

  return {
    noteInkCenterY,
    markInkCenterY,
    markVsNoteInkCenterPx: markInkCenterY - noteInkCenterY,
    absMarkVsNoteInkCenterPx: Math.abs(markInkCenterY - noteInkCenterY),
    contentRight,
    markInkRight: markInk.inkRight,
    inkPastContentRightPx:
      markInk.inkRight != null ? markInk.inkRight - contentRight : null,
    absInkVsContentRightPx:
      markInk.inkRight != null ? Math.abs(markInk.inkRight - contentRight) : null,
    chipCenterX,
    markInkCenterX,
    markVsChipCenterPx: markInkCenterX - chipCenterX,
    absMarkVsChipCenterPx: Math.abs(markInkCenterX - chipCenterX),
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

async function measureFinishFaGap(page) {
  const label = page.locator(".bk-frame-finish-fieldset--shop .bk-frame-finish-label").first();
  await label.waitFor({ state: "visible" });
  const en = label.locator("> span").first();
  const fa = label.locator(".bk-frame-finish-label-fa").first();
  const enBox = await en.boundingBox();
  const faBox = await fa.boundingBox();
  if (!enBox || !faBox) return { error: "no box" };
  return { faGapPx: faBox.x - enBox.x - enBox.width };
}

async function measureTailPortraitFit(page) {
  const portrait = page
    .locator(".bk-tablo-justified-row--tail .bk-tablo-justified-cell")
    .last()
    .locator(".bk-tablo-tile-media")
    .first();
  const count = await portrait.count();
  if (count === 0) return { skipped: true };
  await portrait.scrollIntoViewIfNeeded();
  const slot = await portrait.boundingBox();
  const img = portrait.locator("img").first();
  const imgBox = await img.boundingBox();
  if (!slot || !imgBox) return { error: "no box" };
  return {
    slotWidth: slot.width,
    imgWidth: imgBox.width,
    imgWiderThanSlotPx: imgBox.width - slot.width,
    imgOverflowLeftPx: slot.x - imgBox.x,
    imgOverflowRightPx: imgBox.x + imgBox.width - (slot.x + slot.width),
  };
}

async function measureAtWidth(browser, width) {
  const report = { width, buttons: {}, footer: null, finishLabel: null, finishFaGap: null, tailPortrait: null };

  const shop = await browser.newPage();
  await shop.setViewportSize({ width, height: 900 });
  await shop.goto(pageUrl("/shop"), { waitUntil: "networkidle", timeout: 120000 });
  report.buttons.shopBuy = await measureButton(shop, ".bk-tablo-buy");
  report.footer = await measureFooter(shop);
  if (width === 721) {
    report.tailPortrait = await measureTailPortraitFit(shop);
  }
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
  report.finishFaGap = await measureFinishFaGap(detail);
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
  const allWidths = [...new Set([...widths, 721])].sort((a, b) => a - b);
  for (const w of allWidths) {
    out.push(await measureAtWidth(browser, w));
  }
  await browser.close();
  console.log(JSON.stringify({ base, widths: allWidths, measurements: out }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
