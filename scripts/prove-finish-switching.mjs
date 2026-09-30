#!/usr/bin/env node
import { chromium, firefox, webkit } from "playwright";

const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
const vercelShare = process.env.VERCEL_SHARE?.trim();

function pageUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!vercelShare) return `${base}${p}`;
  const sep = p.includes("?") ? "&" : "?";
  return `${base}${p}${sep}_vercel_share=${encodeURIComponent(vercelShare)}`;
}

const engines = [
  ["chromium", chromium],
  ["firefox", firefox],
  ["webkit", webkit],
];

async function prove(engineName, launcher) {
  const browser = await launcher.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(pageUrl("/shop/berlin-sunset-03"), { waitUntil: "networkidle", timeout: 120000 });
  const finishes = ["matte-black-brushed", "matte-steel-brushed", "bronze"];
  const results = [];
  for (const finish of finishes) {
    await page.locator(`#detail-${finish}`).click();
    await page.waitForTimeout(120);
    const visible = await page.evaluate((f) => {
      const fig = document.querySelector(`.bk-tablo-detail-finish-${f}`);
      if (!fig) return false;
      return getComputedStyle(fig).display !== "none";
    }, finish);
    const buyHref = await page
      .locator(".bk-tablo-buy-lg")
      .filter({ visible: true })
      .first()
      .getAttribute("href");
    results.push({ finish, visible, buyHref: buyHref?.slice(0, 80) });
  }
  await browser.close();
  return { engine: engineName, ok: results.every((r) => r.visible), results };
}

async function main() {
  const out = [];
  for (const [name, launcher] of engines) {
    out.push(await prove(name, launcher));
  }
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
