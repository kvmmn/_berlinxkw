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
    { w: 390, file: "footer-closeup-390.png" },
    { w: 1440, file: "footer-closeup-1440.png" },
  ]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`${baseUrl}/shop`, { waitUntil: "networkidle" });
    const footer = page.locator("footer.bk-public-footer");
    await footer.screenshot({ path: join(outDir, file) });
    console.log("wrote", join(outDir, file));
    await page.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
