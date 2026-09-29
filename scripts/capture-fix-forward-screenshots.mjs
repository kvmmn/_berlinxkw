#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

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

  const footerPage = await browser.newPage();
  await footerPage.setViewportSize({ width: 1440, height: 200 });
  await footerPage.goto(pageUrl("/shop"), { waitUntil: "networkidle" });
  await footerPage.locator("footer.bk-public-footer").screenshot({
    path: join(outDir, "footer-bear-closeup-1440.png"),
  });
  console.log("wrote footer closeup");

  const bearPage = await browser.newPage();
  await bearPage.setViewportSize({ width: 400, height: 400 });
  await bearPage.goto(pageUrl("/shop"), { waitUntil: "networkidle" });
  await bearPage.evaluate(() => {
    const mark = document.querySelector(".bk-public-advisor-mark");
    if (mark instanceof SVGElement) {
      mark.style.width = "300px";
      mark.style.height = "300px";
    }
  });
  const bear = bearPage.locator(".bk-public-advisor-mark");
  await bear.screenshot({ path: join(outDir, "footer-bear-300px.png") });
  console.log("wrote footer bear enlarged");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
