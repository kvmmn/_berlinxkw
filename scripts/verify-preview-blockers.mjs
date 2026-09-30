#!/usr/bin/env node
import { chromium } from "playwright";

const base = (process.argv[2] || "").replace(/\/$/, "");
const share = process.env.VERCEL_SHARE?.trim();
if (!base || !share) {
  console.error("Usage: VERCEL_SHARE=… node scripts/verify-preview-blockers.mjs <baseUrl>");
  process.exit(1);
}

function pageUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const sep = p.includes("?") ? "&" : "?";
  return `${base}${p}${sep}_vercel_share=${encodeURIComponent(share)}`;
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 900 });

  let imageBytes = 0;
  let imageCount = 0;
  page.on("response", (res) => {
    const u = res.url();
    if (u.includes("/_next/image") && res.status() === 200) {
      const cl = Number(res.headers()["content-length"] || 0);
      if (cl) {
        imageBytes += cl;
        imageCount += 1;
      }
    }
  });

  await page.goto(pageUrl("/shop"), { waitUntil: "networkidle", timeout: 180000 });
  const nextImgCount = await page.locator('img[src*="_next/image"]').count();

  const fixtureRes = await page.goto(pageUrl("/shop/gallery-fixture"), {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  const fixtureTitle = await page.title();
  const fixtureH1 = await page.locator("h1").first().textContent().catch(() => null);

  console.log(
    JSON.stringify(
      {
        shop390: {
          nextImageTags: nextImgCount,
          optimizedResponses: imageCount,
          totalImageKB: Math.round(imageBytes / 1024),
        },
        fixture: {
          httpStatus: fixtureRes?.status(),
          title: fixtureTitle,
          h1: fixtureH1?.trim(),
          isApp404: /page not found/i.test(fixtureH1 || fixtureTitle || ""),
        },
      },
      null,
      2,
    ),
  );

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
