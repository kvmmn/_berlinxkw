#!/usr/bin/env node
/**
 * Aggressive hydration capture: fresh contexts, same-tab reload chains, and route sequences.
 * Usage: VERCEL_SHARE=… node scripts/capture-hydration-mismatch.mjs [baseUrl] [iterations=50]
 */
import { chromium } from "playwright";

const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
const iterations = Number.parseInt(process.argv[3] || "50", 10);
const vercelShare = process.env.VERCEL_SHARE?.trim();

function pageUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!vercelShare) return `${base}${p}`;
  const sep = p.includes("?") ? "&" : "?";
  return `${base}${p}${sep}_vercel_share=${encodeURIComponent(vercelShare)}`;
}

function isHydrationSignal(text) {
  return /418|Hydration failed|did not match|Text content does not match|Prop `.*` did not match/i.test(
    text,
  );
}

async function attachListeners(page, bucket) {
  const onConsole = (msg) => {
    const text = msg.text();
    if (isHydrationSignal(text)) bucket.push({ kind: "console", text });
  };
  const onPageError = (err) => {
    const text = String(err);
    if (isHydrationSignal(text)) bucket.push({ kind: "pageerror", text });
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  return () => {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  };
}

async function freshContextLoads(path, n) {
  let failures = 0;
  const samples = [];
  for (let i = 0; i < n; i++) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 1200 });
    const bucket = [];
    const detach = await attachListeners(page, bucket);
    await page.goto(pageUrl(path), { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(250);
    detach();
    if (bucket.length) {
      failures += 1;
      for (const s of bucket) {
        if (samples.length < 5) samples.push(s);
      }
    }
    await browser.close();
  }
  return { failures, samples };
}

async function sameTabReload(path, n) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 1200 });
  let failures = 0;
  const samples = [];
  await page.goto(pageUrl(path), { waitUntil: "networkidle", timeout: 120000 });
  for (let i = 0; i < n; i++) {
    const bucket = [];
    const detach = await attachListeners(page, bucket);
    await page.reload({ waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(200);
    detach();
    if (bucket.length) {
      failures += 1;
      for (const s of bucket) {
        if (samples.length < 5) samples.push(s);
      }
    }
  }
  await browser.close();
  return { failures, samples };
}

async function routeSequence(n) {
  const routes = ["/", "/shop", "/shop/berlin-sunset-03"];
  const browser = await chromium.launch();
  let failures = 0;
  const samples = [];
  for (let i = 0; i < n; i++) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 1200 });
    for (const path of routes) {
      const bucket = [];
      const detach = await attachListeners(page, bucket);
      await page.goto(pageUrl(path), { waitUntil: "networkidle", timeout: 120000 });
      await page.waitForTimeout(150);
      detach();
      if (bucket.length) {
        failures += 1;
        for (const s of bucket) {
          if (samples.length < 8) samples.push({ path, ...s });
        }
      }
    }
    await page.close();
  }
  await browser.close();
  return { failures, samples };
}

async function main() {
  const paths = ["/", "/shop", "/shop/berlin-sunset-03"];
  const report = { base, iterations, freshContext: {}, sameTabReload: {}, routeSequence: null };

  for (const path of paths) {
    report.freshContext[path] = await freshContextLoads(path, iterations);
    report.sameTabReload[path] = await sameTabReload(path, Math.min(iterations, 30));
  }
  report.routeSequence = await routeSequence(Math.min(iterations, 60));

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
