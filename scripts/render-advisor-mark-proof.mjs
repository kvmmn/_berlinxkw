#!/usr/bin/env node
/** Side-by-side + overlay proof for advisor mark vs logo.png reference. */
import { chromium } from "playwright";
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT =
  process.argv[2] || "/opt/cursor/artifacts/advisor-mark-proof";
const SIZE = 512;

const svgModule = readFileSync(join(ROOT, "src/lib/advisor-bear-path.ts"), "utf8");
const viewBox = svgModule.match(/ADVISOR_BEAR_VIEWBOX = "([^"]+)"/)[1];
const traceH = svgModule.match(/ADVISOR_BEAR_TRACE_HEIGHT = (\d+)/)[1];
const pathsJson = svgModule.match(/ADVISOR_BEAR_PATHS: string\[\] = (\[[\s\S]*?\]);/);
const paths = JSON.parse(pathsJson[1]);

function markSvg(fill = "#141412") {
  const pathsHtml = paths.map((d) => `<path d="${d}" fill="${fill}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${SIZE}" height="${SIZE}">
  <g transform="translate(0,${traceH}) scale(0.1,-0.1)" fill-rule="evenodd">${pathsHtml}</g>
</svg>`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: SIZE, height: SIZE });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${markSvg()}</body></html>`,
    { waitUntil: "load" },
  );
  await page.locator("svg").screenshot({
    path: join(OUT, "mono-vector-512.png"),
    omitBackground: true,
  });
  await browser.close();

  const original = join(OUT, "original-logo-512.png");
  const reference = join(OUT, "mono-reference-512.png");
  const vector = join(OUT, "mono-vector-512.png");

  const monoRef = join(OUT, "mono-reference-512.png");
  await sharp({
    create: {
      width: SIZE * 2 + 24,
      height: SIZE + 48,
      channels: 4,
      background: { r: 243, g: 243, b: 239, alpha: 255 },
    },
  })
    .composite([
      { input: original, left: 12, top: 36 },
      { input: monoRef, left: SIZE + 24, top: 36 },
    ])
    .png()
    .toFile(join(OUT, "proof-original-vs-mono-raster.png"));

  await sharp({
    create: {
      width: SIZE * 2 + 24,
      height: SIZE + 48,
      channels: 4,
      background: { r: 243, g: 243, b: 239, alpha: 255 },
    },
  })
    .composite([
      { input: monoRef, left: 12, top: 36 },
      { input: vector, left: SIZE + 24, top: 36 },
    ])
    .png()
    .toFile(join(OUT, "proof-side-by-side.png"));

  const refBuf = await sharp(reference).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const vecBuf = await sharp(vector).resize(SIZE, SIZE).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const w = refBuf.info.width;
  const h = refBuf.info.height;
  const diff = Buffer.alloc(w * h * 4);
  let sum = 0;
  for (let i = 0; i < w * h; i++) {
    const ri = i * 4;
    const a1 = refBuf.data[ri + 3];
    const a2 = vecBuf.data[ri + 3];
    const d = Math.abs(a1 - a2) + Math.abs(refBuf.data[ri] - vecBuf.data[ri]);
    sum += d;
    const v = Math.min(255, d * 2);
    diff[ri] = v;
    diff[ri + 1] = v > 0 ? 0 : 0;
    diff[ri + 2] = v > 0 ? 0 : 0;
    diff[ri + 3] = v > 0 ? 255 : 0;
  }
  await sharp(diff, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(join(OUT, "proof-difference.png"));

  const overlay = await sharp(reference)
    .composite([{ input: vector, blend: "difference" }])
    .png()
    .toFile(join(OUT, "proof-overlay-difference.png"));

  void overlay;
  console.log("mean diff signal", (sum / (w * h)).toFixed(2));
  console.log("wrote proof images to", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
