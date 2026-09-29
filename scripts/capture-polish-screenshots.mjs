#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const baseUrl = process.argv[2];
const outDir = process.argv[3] || "/opt/cursor/artifacts/screenshots/pr-polish/after";

if (!baseUrl) {
  console.error("Usage: node capture-polish-screenshots.mjs <baseUrl> [outDir]");
  process.exit(1);
}

const shots = [
  { file: "shop-1440.png", path: "/shop", width: 1440, height: 1200 },
  { file: "shop-390.png", path: "/shop", width: 390, height: 900 },
  { file: "detail-clouds01-1440.png", path: "/shop/berlin-clouds-01", width: 1440, height: 1200 },
  { file: "detail-sunset3-1440.png", path: "/shop/berlin-sunset-3", width: 1440, height: 1200 },
  { file: "shop-1440-dark-mode.png", path: "/shop", width: 1440, height: 1200, colorScheme: "dark" },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  for (const shot of shots) {
    const context = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
      colorScheme: shot.colorScheme ?? "light",
    });
    const page = await context.newPage();
    await page.goto(`${baseUrl}${shot.path}`, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(600);
    const file = join(outDir, shot.file);
    await page.screenshot({ path: file, fullPage: true });
    console.log("wrote", file);
    await context.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
