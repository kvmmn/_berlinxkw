#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const base = process.argv[2] || "http://127.0.0.1:3001";
const outDir = process.argv[3] || "/opt/cursor/artifacts/screenshots/fix-forward/after";

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();

  for (const w of [1440, 768]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: w === 1440 ? 1400 : 1200 });
    await page.goto(`${base}/shop`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, `proof-shop-gallery-${w}.png`), fullPage: true });
    await page.close();
  }

  for (const w of [390, 1440]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: 220 });
    await page.goto(`${base}/shop`, { waitUntil: "networkidle" });
    await page.locator("footer.bk-public-footer").screenshot({
      path: join(outDir, `proof-footer-${w}.png`),
    });
    await page.close();
  }

  const btnPage = await browser.newPage();
  await btnPage.setViewportSize({ width: 900, height: 500 });
  await btnPage.goto(`${base}/shop`, { waitUntil: "networkidle" });
  await btnPage.locator(".bk-tablo-buy").first().screenshot({
    path: join(outDir, "proof-button-shop-card.png"),
  });
  await btnPage.goto(`${base}/shop/berlin-clouds-01`, { waitUntil: "networkidle" });
  await btnPage.locator(".bk-tablo-buy-lg").screenshot({
    path: join(outDir, "proof-button-detail-lg.png"),
  });
  await btnPage.locator(".bk-frame-finish-fieldset--shop").screenshot({
    path: join(outDir, "proof-finish-labels.png"),
  });
  await btnPage.close();

  const simPage = await browser.newPage();
  await simPage.setViewportSize({ width: 1440, height: 1600 });
  await simPage.goto(`${base}/shop?gallerySim5=1`, { waitUntil: "networkidle" });
  await simPage.screenshot({ path: join(outDir, "proof-shop-sim5-1440.png"), fullPage: true });
  await simPage.close();

  const measure = [];
  for (const url of [`${base}/shop`, `${base}/`, `${base}/shop?gallerySim5=1`]) {
    for (const w of [360, 390, 768, 1440]) {
      const page = await browser.newPage();
      await page.setViewportSize({ width: w, height: 1400 });
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      const m = await page.evaluate(() => {
        const grid = document.querySelector(".bk-tablo-grid");
        if (!grid) return null;
        const gap = Number.parseFloat(getComputedStyle(grid).gap) || 0;
        let maxDead = 0;
        for (const li of grid.querySelectorAll(":scope > li")) {
          const frame = li.querySelector(".bk-aspect-frame");
          const img = li.querySelector(".bk-tablo-picture, img");
          if (!frame || !img) continue;
          const fr = frame.getBoundingClientRect();
          const ir = img.getBoundingClientRect();
          maxDead = Math.max(maxDead, Math.max(0, fr.bottom - ir.bottom), Math.max(0, ir.top - fr.top));
        }
        return { gap, maxDead };
      });
      measure.push({ url: url.replace(base, ""), width: w, ...m });
      await page.close();
    }
  }
  await writeFile(join(outDir, "proof-gallery-dead-gap-measurements.json"), JSON.stringify(measure, null, 2));
  await browser.close();
  console.log("wrote proofs to", outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
