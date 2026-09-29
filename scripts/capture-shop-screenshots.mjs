#!/usr/bin/env node
import { chromium, devices } from "playwright";
import { mkdir } from "fs/promises";
import { join } from "path";

const baseUrl = process.argv[2] || "http://127.0.0.1:3000";
const outDir = process.argv[3] || join(process.cwd(), "screenshots");

const routes = [
  { name: "home", path: "/" },
  { name: "shop", path: "/shop" },
  { name: "tablo-berlin-clouds-01", path: "/shop/berlin-clouds-01" },
];

async function capture(page, url, filePath) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: filePath, fullPage: true });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();

  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const desktopPage = await desktop.newPage();
  for (const route of routes) {
    const file = join(outDir, `${route.name}-desktop.png`);
    await capture(desktopPage, `${baseUrl}${route.path}`, file);
    console.log("wrote", file);
  }
  await desktop.close();

  const iphone = devices["iPhone 13"];
  const mobile = await browser.newContext({ ...iphone });
  const mobilePage = await mobile.newPage();
  for (const route of routes) {
    const file = join(outDir, `${route.name}-mobile.png`);
    await capture(mobilePage, `${baseUrl}${route.path}`, file);
    console.log("wrote", file);
  }
  await mobile.close();

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
