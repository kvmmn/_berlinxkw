#!/usr/bin/env node
/**
 * Gallery / footer / button / finish measurements for PR #23 (Vercel preview or local).
 * Usage: node scripts/measure-vercel-pr23.mjs <baseUrl>
 */
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const base = (process.argv[2] || "http://127.0.0.1:3001").replace(/\/$/, "");
const vercelShare = process.env.VERCEL_SHARE?.trim();
function pageUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!vercelShare) return `${base}${p}`;
  const sep = p.includes("?") ? "&" : "?";
  return `${base}${p}${sep}_vercel_share=${encodeURIComponent(vercelShare)}`;
}
const widths = [360, 390, 768, 1024, 1200, 1440];
const __dirname = dirname(fileURLToPath(import.meta.url));

async function measureGallery(page) {
  return page.evaluate(() => {
    const grid = document.querySelector(".bk-tablo-justified-gallery");
    if (!grid) return { error: "no gallery" };
    const gr = grid.getBoundingClientRect();
    const gap = Number.parseFloat(getComputedStyle(grid).gap) || 0;
    let maxDead = 0;
    let minVisiblePct = 100;
    const cells = [];
    const rows = [];
    const rowEls = [...grid.querySelectorAll(":scope > .bk-tablo-justified-row")];
    const lis =
      rowEls.length > 0
        ? rowEls.flatMap((row) => [...row.querySelectorAll(".bk-tablo-justified-cell")])
        : [...grid.querySelectorAll(".bk-tablo-justified-cell")];
    let maxRight = 0;
    for (const rowEl of rowEls.length ? rowEls : [grid]) {
      const rowCells = rowEl === grid ? lis : [...rowEl.querySelectorAll(".bk-tablo-justified-cell")];
      const heights = [];
      let rowMaxRight = 0;
      for (const li of rowCells) {
        const frame = li.querySelector(".bk-aspect-frame, .bk-tablo-tile-media");
        const img = li.querySelector(".bk-tablo-picture, img");
        if (!frame) continue;
        const fr = frame.getBoundingClientRect();
        const ir = img?.getBoundingClientRect();
        heights.push(fr.height);
        rowMaxRight = Math.max(rowMaxRight, li.getBoundingClientRect().right);
        maxRight = Math.max(maxRight, li.getBoundingClientRect().right);
        const deadBelow = ir ? Math.max(0, fr.bottom - ir.bottom) : 0;
        const deadAbove = ir ? Math.max(0, ir.top - fr.top) : 0;
        const deadSide =
          ir && fr.width > 0
            ? Math.max(0, fr.right - ir.right, ir.left - fr.left)
            : 0;
        const dead = Math.max(deadBelow, deadAbove, deadSide);
        maxDead = Math.max(maxDead, dead);
        let visiblePct = 100;
        if (ir && img) {
          const nw = img.naturalWidth || ir.width;
          const nh = img.naturalHeight || ir.height;
          if (nw && nh) {
            const scale = Math.min(ir.width / nw, ir.height / nh);
            const shownW = nw * scale;
            const shownH = nh * scale;
            visiblePct = Math.min(100, (shownW / ir.width) * 100, (shownH / ir.height) * 100);
          }
        }
        minVisiblePct = Math.min(minVisiblePct, visiblePct);
        cells.push({
          dead,
          frameW: fr.width,
          frameH: fr.height,
          imgW: ir?.width ?? 0,
          imgH: ir?.height ?? 0,
          visiblePct,
        });
      }
      if (heights.length) {
        const minH = Math.min(...heights);
        const maxH = Math.max(...heights);
        const rowTrailing = Math.max(0, gr.right - rowMaxRight);
        maxDead = Math.max(maxDead, rowTrailing);
        rows.push({ heightSpread: maxH - minH, rowTrailing, count: rowCells.length });
      }
    }
    const trailingDead = Math.max(0, gr.right - maxRight);
    return { gap, maxDead, trailingDead, minVisiblePct, cellCount: cells.length, cells, rows };
  });
}

async function measureGalleryHeightsBeforeAfter(page) {
  const before = await page.evaluate(() => {
    const out = [];
    for (const li of document.querySelectorAll(".bk-tablo-justified-cell")) {
      const frame = li.querySelector(".bk-aspect-frame");
      if (frame) out.push(frame.getBoundingClientRect().height);
    }
    return out;
  });
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => {
    const out = [];
    for (const li of document.querySelectorAll(".bk-tablo-justified-cell")) {
      const frame = li.querySelector(".bk-aspect-frame");
      if (frame) out.push(frame.getBoundingClientRect().height);
    }
    return out;
  });
  const jumps = before.map((h, i) => Math.abs((after[i] ?? h) - h));
  return { before, after, maxJump: jumps.length ? Math.max(...jumps) : 0 };
}

async function measureButtonInk(page, selector) {
  return page.evaluate((sel) => {
    const btn = document.querySelector(sel);
    if (!btn) return { error: "no button" };
    const br = btn.getBoundingClientRect();
    const centerY = br.top + br.height / 2;
    const range = document.createRange();
    range.selectNodeContents(btn);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    if (!rects.length) return { error: "no glyph rects" };
    let top = Infinity;
    let bottom = -Infinity;
    for (const r of rects) {
      top = Math.min(top, r.top);
      bottom = Math.max(bottom, r.bottom);
    }
    const inkCenter = (top + bottom) / 2;
    return { offsetPx: inkCenter - centerY, btnH: br.height };
  }, selector);
}

async function measureFinishFaStarts(page) {
  return page.evaluate(() => {
    const options = [
      ...document.querySelectorAll(".bk-frame-finish-fieldset--shop .bk-frame-finish-option"),
    ];
    const pairs = options.map((opt) => {
      const en = opt.querySelector(".bk-frame-finish-label > span:first-child");
      const fa = opt.querySelector(".bk-frame-finish-label-fa");
      if (!en || !fa) return null;
      const enR = en.getBoundingClientRect();
      const faR = fa.getBoundingClientRect();
      return { gapPx: faR.left - enR.right, faLeft: faR.left };
    }).filter(Boolean);
    const faStarts = pairs.map((p) => p.faLeft);
    const spread = faStarts.length ? Math.max(...faStarts) - Math.min(...faStarts) : 0;
    const maxGap = pairs.length ? Math.max(...pairs.map((p) => p.gapPx)) : 0;
    return { pairs, spread, maxGapFromEnglish: maxGap };
  });
}

async function measureFooterMark(page) {
  return page.evaluate(() => {
    const shell = document.querySelector(".bk-public-footer .bk-public-shell");
    const link = document.querySelector(".bk-public-footer-advisor");
    const svg = document.querySelector(".bk-public-advisor-mark");
    const path = svg?.querySelector("path");
    if (!shell || !link || !path) return { error: "missing footer nodes" };
    const sr = shell.getBoundingClientRect();
    const lr = link.getBoundingClientRect();
    const pr = path.getBoundingClientRect();
    const footerText = document.querySelector(".bk-public-footer-bar > span");
    const textR = footerText?.getBoundingClientRect();
    return {
      shellRight: sr.right,
      linkRight: lr.right,
      pathRight: pr.right,
      pathOverflowPastShell: pr.right - sr.right,
      linkOverflowPastShell: lr.right - sr.right,
      pathVsTextCenterDelta:
        textR && textR.height > 0 ? pr.top + pr.height / 2 - (textR.top + textR.height / 2) : null,
    };
  });
}

async function measurePlusEur(page) {
  return page.evaluate(() => {
    const desc = document.querySelector(".bk-tablo-detail-desc");
    if (!desc) return { error: "no desc" };
    const text = desc.textContent || "";
    return { snippet: text.slice(0, 120), hasSpacePlusEur: /\+\s+€/.test(text), hasPlusEur: /\+€/.test(text) };
  });
}

async function loadFiveFixtureHtml() {
  return readFile(join(__dirname, "fixtures/gallery-five-tablos.html"), "utf8");
}

async function main() {
  const browser = await chromium.launch();
  const report = { base, gallery: [], clsProxy: [], buttons: {}, finish: null, footer: null, plusEur: null, fiveFixture: [] };

  for (const path of ["/shop", "/"]) {
    for (const w of widths) {
      const page = await browser.newPage();
      await page.setViewportSize({ width: w, height: w >= 1200 ? 1600 : 1200 });
      await page.goto(pageUrl(path), { waitUntil: "networkidle", timeout: 120000 });
      await page.waitForTimeout(350);
      const m = await measureGallery(page);
      let heightJump = null;
      if (path === "/shop" && w === 1440) {
        heightJump = await measureGalleryHeightsBeforeAfter(page);
      }
      report.gallery.push({ path, width: w, ...m, heightJump });
      await page.close();
    }
  }

  const finishPage = await browser.newPage();
  await finishPage.setViewportSize({ width: 900, height: 1200 });
  await finishPage.goto(pageUrl("/shop/berlin-clouds-01"), { waitUntil: "networkidle", timeout: 120000 });
  report.finish = await measureFinishFaStarts(finishPage);
  report.plusEur = await measurePlusEur(finishPage);
  report.buttons.detailBuy = await measureButtonInk(finishPage, ".bk-tablo-buy-lg");
  await finishPage.close();

  const shopBtnPage = await browser.newPage();
  await shopBtnPage.setViewportSize({ width: 900, height: 800 });
  await shopBtnPage.goto(pageUrl("/shop"), { waitUntil: "networkidle", timeout: 120000 });
  report.buttons.shopBuy = await measureButtonInk(shopBtnPage, ".bk-tablo-buy");
  await shopBtnPage.close();

  const homePage = await browser.newPage();
  await homePage.setViewportSize({ width: 900, height: 800 });
  await homePage.goto(pageUrl("/"), { waitUntil: "networkidle", timeout: 120000 });
  report.buttons.viewShop = await measureButtonInk(homePage, ".bk-landing-actions .bk-btn-primary");
  report.buttons.instagram = await measureButtonInk(homePage, ".bk-landing-actions .bk-btn:not(.bk-btn-primary)");
  await homePage.close();

  const footPage = await browser.newPage();
  await footPage.setViewportSize({ width: 1440, height: 400 });
  await footPage.goto(pageUrl("/shop"), { waitUntil: "networkidle", timeout: 120000 });
  report.footer = await measureFooterMark(footPage);
  await footPage.close();

  const fixtureHtml = await loadFiveFixtureHtml();
  for (const w of widths) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: 1400 });
    await page.setContent(fixtureHtml, { waitUntil: "load" });
    await page.waitForTimeout(100);
    const m = await measureGallery(page);
    report.fiveFixture.push({ width: w, ...m });
    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
