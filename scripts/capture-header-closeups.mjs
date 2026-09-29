#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const baseUrl = process.argv[2] || "http://127.0.0.1:3001";
const outDir = process.argv[3] || "/opt/cursor/artifacts/screenshots/pr-polish";

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  for (const { w, file } of [
    { w: 390, file: "header-closeup-390.png" },
    { w: 1440, file: "header-closeup-1440.png" },
  ]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: 200 });
    await page.goto(`${baseUrl}/shop`, { waitUntil: "networkidle" });
    const header = page.locator("header.bk-public-header");
    await header.screenshot({ path: join(outDir, file) });
    console.log("wrote", join(outDir, file));
    await page.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
