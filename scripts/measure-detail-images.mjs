#!/usr/bin/env node
/**
 * Detail page: optimized image bytes/format + slow-4G LCP.
 * Usage: VERCEL_SHARE=… node scripts/measure-detail-images.mjs <baseUrl> [slug=berlin-sunset-03]
 */
import { chromium, devices } from "playwright";

const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
const slug = process.argv[3] || "berlin-sunset-03";
const vercelShare = process.env.VERCEL_SHARE?.trim();

function pageUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!vercelShare) return `${base}${p}`;
  const sep = p.includes("?") ? "&" : "?";
  return `${base}${p}${sep}_vercel_share=${encodeURIComponent(vercelShare)}`;
}

async function measureImages(page, path) {
  const responses = [];
  page.on("response", async (res) => {
    const u = res.url();
    if (!u.includes("/_next/image") || res.status() !== 200) return;
    const buf = await res.body().catch(() => null);
    if (!buf) return;
    responses.push({
      url: u.split("?")[0] + "?" + (u.split("?")[1] || "").slice(0, 80),
      bytes: buf.length,
      contentType: res.headers()["content-type"] || "",
    });
  });
  await page.goto(pageUrl(path), { waitUntil: "networkidle", timeout: 180000 });
  await page.waitForTimeout(500);
  const total = responses.reduce((a, r) => a + r.bytes, 0);
  return {
    count: responses.length,
    totalBytes: total,
    totalKB: Math.round(total / 1024),
    samples: responses.slice(0, 6),
  };
}

async function measureLcpSlow4G(page, path) {
  const client = await page.context().newCDPSession(page);
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: (400 * 1024) / 8,
    uploadThroughput: (400 * 1024) / 8,
    latency: 400,
  });
  await page.goto(pageUrl(path), { waitUntil: "load", timeout: 180000 });
  const lcp = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let value = null;
      const obs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) value = last.startTime;
      });
      obs.observe({ type: "largest-contentful-paint", buffered: true });
      setTimeout(() => {
        obs.disconnect();
        resolve(value);
      }, 8000);
    });
  });
  return { lcpMs: lcp != null ? Math.round(lcp) : null };
}

async function main() {
  const path = `/shop/${slug}`;
  const report = { base, path, viewports: {} };

  for (const { name, width, dpr } of [
    { name: "390-dpr1", width: 390, dpr: 1 },
    { name: "390-dpr2", width: 390, dpr: 2 },
    { name: "1440-dpr1", width: 1440, dpr: 1 },
    { name: "1440-dpr2", width: 1440, dpr: 2 },
  ]) {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: dpr,
    });
    const page = await context.newPage();
    report.viewports[name] = await measureImages(page, path);
    await context.close();
    await browser.close();
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ ...devices["Pixel 5"] });
  report.slow4g = await measureLcpSlow4G(page, path);
  await browser.close();

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
