#!/usr/bin/env node
/** One-off: path getBBox in Playwright → tight viewBox string (path data unchanged). */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, "../src/lib/advisor-bear-path.ts"), "utf8");
const viewBoxMatch = src.match(/ADVISOR_BEAR_VIEWBOX = "([^"]+)"/);
const pathMatch = src.match(/ADVISOR_BEAR_PATH_D =\s*\n\s*"([^"]+)"/s);
if (!viewBoxMatch || !pathMatch) {
  console.error("Could not parse advisor-bear-path.ts");
  process.exit(1);
}
const viewBox = viewBoxMatch[1];
const pathD = pathMatch[1];

async function main() {
  const html = `<!DOCTYPE html><html><body>
<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
<path id="p" fill="#141412" d="${pathD}" />
</svg></body></html>`;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const bbox = await page.evaluate(() => {
    const b = document.getElementById("p").getBBox();
    return { x: b.x, y: b.y, width: b.width, height: b.height };
  });
  await browser.close();
  const pad = 0;
  const tight = `${bbox.x - pad} ${bbox.y - pad} ${bbox.width + 2 * pad} ${bbox.height + 2 * pad}`;
  console.log(JSON.stringify({ viewBox, pathBBox: bbox, tightViewBox: tight }, null, 2));
}

main();
