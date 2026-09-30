#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
const rawBase = process.argv[2] || "http://127.0.0.1:3000";
const outDir = process.argv[3] || "/opt/cursor/artifacts/screenshots/fix-forward";

const parsed = new URL(rawBase.includes("://") ? rawBase : `http://${rawBase}`);
const origin = `${parsed.protocol}//${parsed.host}`;
const shareQuery = parsed.search;

function pageUrl(pathname) {
  return `${origin}${pathname}${shareQuery}`;
}

const shopWidths = [390, 768, 1024, 1200, 1440];

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();

  for (const w of shopWidths) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: w >= 1200 ? 1600 : 1200 });
    await page.goto(pageUrl("/shop"), { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(400);
    const file = join(outDir, `shop-${w}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log("wrote", file);
    await page.close();
  }

  const { readFile } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const fixtureDir = dirname(fileURLToPath(import.meta.url));
  const fixtureHtml = await readFile(join(fixtureDir, "fixtures/gallery-fixture-tiles.html"), "utf8");
  const fixturePage = await browser.newPage();
  await fixturePage.setViewportSize({ width: 1440, height: 2400 });
  await fixturePage.setContent(fixtureHtml, { waitUntil: "load" });
  await fixturePage.waitForTimeout(200);
  await fixturePage.locator("#fixture-four").screenshot({
    path: join(outDir, "gallery-four-tablos-1440.png"),
  });
  await fixturePage.locator("#fixture-five").screenshot({
    path: join(outDir, "gallery-five-tablos-1440.png"),
  });
  console.log("wrote gallery fixture tiles (scripts/fixtures)");
  await fixturePage.close();

  const btnPage = await browser.newPage();
  await btnPage.setViewportSize({ width: 900, height: 800 });
  await btnPage.goto(pageUrl("/shop"), { waitUntil: "networkidle", timeout: 120000 });
  const buy = btnPage.locator(".bk-tablo-buy").first();
  await buy.waitFor({ state: "visible" });
  const box = await buy.boundingBox();
  if (box) {
    await btnPage.screenshot({
      path: join(outDir, "button-buy-4x.png"),
      clip: {
        x: Math.max(0, box.x - box.width * 0.5),
        y: Math.max(0, box.y - box.height * 0.5),
        width: box.width * 2,
        height: box.height * 2,
      },
    });
    console.log("wrote button 4x");
  }
  await btnPage.close();

  for (const w of [390, 1440]) {
    const finishPage = await browser.newPage();
    await finishPage.setViewportSize({ width: w, height: 1200 });
    await finishPage.goto(pageUrl("/shop/berlin-clouds-01"), { waitUntil: "networkidle", timeout: 120000 });
    await finishPage.locator(".bk-frame-finish-fieldset--shop").screenshot({
      path: join(outDir, `finish-labels-${w}.png`),
    });
    console.log("wrote finish labels", w);
    await finishPage.close();
  }

  for (const w of [390, 1440]) {
    const footerPage = await browser.newPage();
    await footerPage.setViewportSize({ width: w, height: 220 });
    await footerPage.goto(pageUrl("/shop"), { waitUntil: "networkidle" });
    await footerPage.locator("footer.bk-public-footer").screenshot({
      path: join(outDir, `footer-bear-closeup-${w}.png`),
    });
    console.log("wrote footer closeup", w);
    await footerPage.close();
  }

  const foot4 = await browser.newPage();
  await foot4.setViewportSize({ width: 1440, height: 220 });
  await foot4.goto(pageUrl("/shop"), { waitUntil: "networkidle" });
  const link = foot4.locator(".bk-public-footer-advisor").first();
  const lbox = await link.boundingBox();
  if (lbox) {
    await link.screenshot({ path: join(outDir, "footer-bear-4x.png"), scale: "css" });
    console.log("wrote footer 4x");
  }
  await foot4.close();

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
