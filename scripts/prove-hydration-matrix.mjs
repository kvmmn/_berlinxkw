#!/usr/bin/env node
/**
 * Reviewer matrix: one Chromium browser, fresh context per load, normal cache,
 * cycle 390/768/1440 × light/dark, block vercel.live. 3 rounds × 30 per page.
 * Usage: VERCEL_SHARE=… node scripts/prove-hydration-matrix.mjs [baseUrl]
 */
import { chromium } from "playwright";

const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
const rounds = Number.parseInt(process.argv[3] || "3", 10);
const loadsPerPage = Number.parseInt(process.argv[4] || "30", 10);
const vercelShare = process.env.VERCEL_SHARE?.trim();

const COMBOS = [
  { tag: "390light", width: 390, height: 844, colorScheme: "light" },
  { tag: "390dark", width: 390, height: 844, colorScheme: "dark" },
  { tag: "768light", width: 768, height: 900, colorScheme: "light" },
  { tag: "768dark", width: 768, height: 900, colorScheme: "dark" },
  { tag: "1440light", width: 1440, height: 900, colorScheme: "light" },
  { tag: "1440dark", width: 1440, height: 900, colorScheme: "dark" },
];

const paths = ["/shop", "/", "/shop/berlin-sunset-03"];

function pageUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!vercelShare) return `${base}${p}`;
  const sep = p.includes("?") ? "&" : "?";
  return `${base}${p}${sep}_vercel_share=${encodeURIComponent(vercelShare)}`;
}

function isHydrationSignal(text) {
  return /418|Hydration failed|did not match/i.test(text);
}

async function setupContext(browser, combo) {
  const context = await browser.newContext({
    viewport: { width: combo.width, height: combo.height },
    colorScheme: combo.colorScheme,
  });
  await context.addInitScript(() => {
    const block = (url) => typeof url === "string" && url.includes("vercel.live");
    const origFetch = window.fetch;
    window.fetch = (input, init) => {
      const url = typeof input === "string" ? input : input.url;
      if (block(url)) return Promise.reject(new Error("blocked vercel.live"));
      return origFetch(input, init);
    };
  });
  await context.route("**/*", (route) => {
    if (route.request().url().includes("vercel.live")) {
      return route.abort();
    }
    return route.continue();
  });
  return context;
}

async function main() {
  const browser = await chromium.launch();
  const report = { base, rounds, loadsPerPage, pages: {}, totalFailures: 0, totalLoads: 0 };

  for (const path of paths) {
    let failures = 0;
    const byCombo = {};
    const samples = [];

    for (let round = 0; round < rounds; round++) {
      for (let i = 0; i < loadsPerPage; i++) {
        const combo = COMBOS[(round * loadsPerPage + i) % COMBOS.length];
        const context = await setupContext(browser, combo);
        const page = await context.newPage();
        const bucket = [];
        page.on("console", (msg) => {
          const t = msg.text();
          if (isHydrationSignal(t)) bucket.push({ kind: "console", combo: combo.tag, text: t });
        });
        page.on("pageerror", (err) => {
          const t = String(err);
          if (isHydrationSignal(t)) bucket.push({ kind: "pageerror", combo: combo.tag, text: t });
        });
        try {
          await page.goto(pageUrl(path), { waitUntil: "networkidle", timeout: 120000 });
          await page.waitForTimeout(150);
        } catch (e) {
          bucket.push({ kind: "goto", combo: combo.tag, text: String(e) });
        }
        if (bucket.length) {
          failures += 1;
          const key = combo.tag;
          byCombo[key] = (byCombo[key] || 0) + 1;
          if (samples.length < 8) samples.push(...bucket);
        }
        await context.close();
      }
    }

    const loads = rounds * loadsPerPage;
    report.pages[path] = { loads, hydrationFailures: failures, byCombo, samples: [...samples].slice(0, 5) };
    report.totalFailures += failures;
    report.totalLoads += loads;
  }

  await browser.close();
  report.failureRate = report.totalFailures / report.totalLoads;
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
