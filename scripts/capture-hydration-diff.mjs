#!/usr/bin/env node
/**
 * Capture React #418 with normal browser cache: record raw document response,
 * pre-hydration DOM snapshot, and diff on failure.
 * Usage: node scripts/capture-hydration-diff.mjs [baseUrl] [path] [attempts=120]
 */
import { chromium } from "playwright";

const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
const path = process.argv[3] || "/shop/berlin-sunset-03";
const attempts = Number.parseInt(process.argv[4] || "120", 10);
const vercelShare = process.env.VERCEL_SHARE?.trim();

function pageUrl(p) {
  const pathname = p.startsWith("/") ? p : `/${p}`;
  if (!vercelShare) return `${base}${pathname}`;
  const sep = pathname.includes("?") ? "&" : "?";
  return `${base}${pathname}${sep}_vercel_share=${encodeURIComponent(vercelShare)}`;
}

const PRE_HYDRATE_SNAPSHOT = `
(() => {
  window.__bkPreHydrateHtml = null;
  const snap = () => {
    if (document.documentElement && !window.__bkPreHydrateHtml) {
      window.__bkPreHydrateHtml = document.documentElement.outerHTML;
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", snap, { once: true });
  } else {
    snap();
  }
})();
`;

function normalizeHtml(html) {
  return html
    .replace(/\sdata-reactroot=""/g, "")
    .replace(/\sdata-cursor-ref="[^"]*"/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstMismatch(a, b) {
  const max = Math.min(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i] !== b[i]) {
      const start = Math.max(0, i - 80);
      return {
        index: i,
        serverSnippet: a.slice(start, i + 120),
        clientSnippet: b.slice(start, i + 120),
      };
    }
  }
  if (a.length !== b.length) {
    return { index: max, lengthDelta: a.length - b.length };
  }
  return null;
}

function extractTagContext(html, index) {
  const slice = html.slice(Math.max(0, index - 400), index + 400);
  const tagMatch = slice.match(/<([a-zA-Z0-9-]+)[^>]{0,200}>/g);
  return tagMatch ? tagMatch.slice(-3) : [];
}

async function runOnce(browser, url) {
  let serverHtml = "";
  const context = await browser.newContext();
  await context.addInitScript(PRE_HYDRATE_SNAPSHOT);
  const page = await context.newPage();

  page.on("response", async (res) => {
    try {
      const req = res.request();
      if (req.resourceType() === "document" && req.url().split("?")[0] === url.split("?")[0]) {
        serverHtml = await res.text();
      }
    } catch {
      /* body unavailable */
    }
  });

  const errors = [];
  page.on("console", (msg) => {
    const t = msg.text();
    if (/418|Hydration failed|did not match/i.test(t)) errors.push(t);
  });
  page.on("pageerror", (err) => {
    if (/418|Hydration/i.test(String(err))) errors.push(String(err));
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(300);

  const preHydrate = await page.evaluate(() => window.__bkPreHydrateHtml || "");
  const postDom = await page.evaluate(() => document.documentElement.outerHTML);

  await context.close();

  return { serverHtml, preHydrate, postDom, errors: [...new Set(errors)] };
}

async function main() {
  const url = pageUrl(path);
  const browser = await chromium.launch();
  let failures = 0;
  let sample = null;

  for (let i = 0; i < attempts; i++) {
    const result = await runOnce(browser, url);
    if (result.errors.length) {
      failures += 1;
      if (!sample) {
        const normServer = normalizeHtml(result.serverHtml);
        const normPre = normalizeHtml(result.preHydrate);
        const normPost = normalizeHtml(result.postDom);
        const serverVsPre = firstMismatch(normServer, normPre);
        const preVsPost = firstMismatch(normPre, normPost);
        sample = {
          attempt: i + 1,
          errors: result.errors,
          serverVsPre,
          preVsPost,
          serverTags: serverVsPre ? extractTagContext(normServer, serverVsPre.index) : [],
          preTags: preVsPost ? extractTagContext(normPre, preVsPost.index) : [],
        };
      }
    }
  }

  await browser.close();
  console.log(
    JSON.stringify(
      {
        url,
        attempts,
        failures,
        failureRate: failures / attempts,
        sample,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
