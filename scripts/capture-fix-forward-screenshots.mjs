#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const logoFileUrl = pathToFileURL(join(process.cwd(), "public/logo.png")).href;

const rawBase = process.argv[2] || "http://127.0.0.1:3001";
const outDir = process.argv[3] || "/opt/cursor/artifacts/screenshots/fix-forward";

const parsed = new URL(rawBase.includes("://") ? rawBase : `http://${rawBase}`);
const origin = `${parsed.protocol}//${parsed.host}`;
const shareQuery = parsed.search;

function pageUrl(pathname) {
  return `${origin}${pathname}${shareQuery}`;
}

const shopWidths = [390, 768, 1440];
const details = [
  { slug: "berlin-clouds-01", widths: [390, 1440] },
  { slug: "berlin-sunset-03", widths: [390, 1440] },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();

  for (const w of shopWidths) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: w === 1440 ? 1400 : 1200 });
    await page.goto(pageUrl("/shop"), { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(500);
    const file = join(outDir, `shop-${w}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log("wrote", file);
    await page.close();
  }

  for (const d of details) {
    for (const w of d.widths) {
      const page = await browser.newPage();
      await page.setViewportSize({ width: w, height: 1200 });
      await page.goto(pageUrl(`/shop/${d.slug}`), { waitUntil: "networkidle", timeout: 120000 });
      await page.waitForTimeout(500);
      const file = join(outDir, `detail-${d.slug}-${w}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log("wrote", file);
      if (w === 1440) {
        const html = await page.content();
        const spec = html.match(/bk-tablo-detail-frame-spec[^>]*>([\s\S]*?)<\/p>/);
        await writeFile(join(outDir, `${d.slug}-frame-spec-snippet.txt`), spec?.[1] ?? "not found");
      }
      await page.close();
    }
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

  const comparePage = await browser.newPage();
  await comparePage.goto(pageUrl("/shop"), { waitUntil: "networkidle" });
  const markSvg = await comparePage.evaluate(() => {
    const el = document.querySelector(".bk-public-advisor-mark");
    return el?.outerHTML ?? "";
  });
  await comparePage.setViewportSize({ width: 720, height: 320 });
  await comparePage.setContent(`<!DOCTYPE html>
<html><head><style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #f5f5f3; }
  .row { display: flex; align-items: center; justify-content: center; gap: 2rem; padding: 2rem; }
  figcaption { text-align: center; font-size: 12px; color: #666; margin-top: 0.5rem; }
  figure { margin: 0; }
  img, svg { width: 160px; height: 160px; object-fit: contain; display: block; }
  .mark svg { width: 160px; height: 160px; }
</style></head><body>
  <div class="row">
    <figure><img src="${logoFileUrl}" alt="logo.png"/><figcaption>public/logo.png</figcaption></figure>
    <figure class="mark">${markSvg}<figcaption>footer mark (rendered)</figcaption></figure>
  </div>
</body></html>`);
  await comparePage.screenshot({
    path: join(outDir, "proof-logo-vs-footer-mark.png"),
    fullPage: true,
  });
  console.log("wrote proof-logo-vs-footer-mark");
  await comparePage.close();

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
