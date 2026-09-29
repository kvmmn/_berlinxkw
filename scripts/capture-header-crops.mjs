#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { join } from "path";

const baseUrl = process.argv[2] || "http://127.0.0.1:3000";
const outDir = process.argv[3] || join(process.cwd(), "screenshots", "headers");

const shots = [
  { name: "shop-header", path: "/shop", selector: ".bk-shop-header", widths: [1440, 390] },
  { name: "home-hero-brand", path: "/", selector: ".bk-public-brand--hero", widths: [1440, 390] },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();

  for (const shot of shots) {
    for (const width of shot.widths) {
      const context = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 900 },
      });
      const page = await context.newPage();
      await page.goto(`${baseUrl}${shot.path}`, { waitUntil: "networkidle", timeout: 90000 });
      await page.waitForTimeout(600);
      const el = page.locator(shot.selector).first();
      const file = join(outDir, `${shot.name}-${width}.png`);
      await el.screenshot({ path: file });
      console.log("wrote", file);
      await context.close();
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
