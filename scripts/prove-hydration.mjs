#!/usr/bin/env node
/**
 * Reload pages and count React hydration failures (#418 / "Hydration failed").
 * Usage: node scripts/prove-hydration.mjs [baseUrl] [loadsPerPage=30]
 */
import { chromium } from "playwright";

const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
const loadsPerPage = Number.parseInt(process.argv[3] || "30", 10);
const mode = process.argv.includes("--reload") ? "reload" : "fresh";
const vercelShare = process.env.VERCEL_SHARE?.trim();

function pageUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!vercelShare) return `${base}${p}`;
  const sep = p.includes("?") ? "&" : "?";
  return `${base}${p}${sep}_vercel_share=${encodeURIComponent(vercelShare)}`;
}

const paths = ["/shop", "/", "/shop/berlin-sunset-03"];

async function loadOnce(page, path) {
  const errors = [];
  const onConsole = (msg) => {
    const text = msg.text();
    if (/418|Hydration failed|did not match/i.test(text)) errors.push(text);
  };
  const onPageError = (err) => {
    if (/418|Hydration/i.test(String(err))) errors.push(String(err));
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  await page.goto(pageUrl(path), { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(200);
  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  return errors;
}

async function main() {
  const browser = await chromium.launch();
  const report = { base, loadsPerPage, mode, pages: {} };

  for (const path of paths) {
    let failures = 0;
    const samples = [];
    if (mode === "reload") {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 1200 });
      await page.goto(pageUrl(path), { waitUntil: "networkidle", timeout: 120000 });
      for (let i = 0; i < loadsPerPage; i++) {
        const errs = [];
        const onConsole = (msg) => {
          const text = msg.text();
          if (/418|Hydration failed|did not match/i.test(text)) errs.push(text);
        };
        const onPageError = (err) => {
          if (/418|Hydration/i.test(String(err))) errs.push(String(err));
        };
        page.on("console", onConsole);
        page.on("pageerror", onPageError);
        await page.reload({ waitUntil: "networkidle", timeout: 120000 });
        await page.waitForTimeout(200);
        page.off("console", onConsole);
        page.off("pageerror", onPageError);
        if (errs.length) {
          failures += 1;
          if (samples.length < 3) samples.push(...errs);
        }
      }
      await page.close();
    } else {
      for (let i = 0; i < loadsPerPage; i++) {
        const page = await browser.newPage();
        await page.setViewportSize({ width: 1440, height: 1200 });
        const errs = await loadOnce(page, path);
        if (errs.length) {
          failures += 1;
          if (samples.length < 3) samples.push(...errs);
        }
        await page.close();
      }
    }
    report.pages[path] = { loads: loadsPerPage, hydrationFailures: failures, samples: [...new Set(samples)] };
  }

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
