#!/usr/bin/env node
/**
 * Precise potrace of public/logo.png (portal/login mark) → monochrome ink paths.
 * Lime → filled; page black → transparent; black eyes/details inside lime → holes.
 */
import sharp from "sharp";
import { execSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOGO = join(ROOT, "public/logo.png");
const OUT_TS = join(ROOT, "src/lib/advisor-bear-path.ts");
const ARTIFACT_DIR =
  process.argv[2] || join(ROOT, "../opt/cursor/artifacts/advisor-mark-proof");

function writeP4(w, h, getBit) {
  const rowBytes = Math.ceil(w / 8);
  const buf = Buffer.alloc(rowBytes * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (getBit(x, y)) {
        const idx = y * rowBytes + (x >> 3);
        buf[idx] |= 128 >> (x & 7);
      }
    }
  }
  return Buffer.concat([Buffer.from(`P4\n${w} ${h}\n`), buf]);
}

function isPureBg(r, g, b) {
  return r < 6 && g < 6 && b < 6;
}

/** Neon liquid orb in logo.png (not part of the bear silhouette). */
function isGlow(r, g, b) {
  return g > 88 && g > r * 1.25 && g > b * 1.1;
}

/** Dark bear body / facial cut-outs inside the orb (portal mark). */
function isBearPixel(r, g, b) {
  if (isPureBg(r, g, b) || isGlow(r, g, b)) return false;
  const sum = r + g + b;
  return sum < 135 && g < 105;
}

function buildInkMask(data, w, h) {
  const candidate = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      candidate[y * w + x] = isBearPixel(data[i], data[i + 1], data[i + 2]) ? 1 : 0;
    }
  }
  const ink = new Uint8Array(w * h);
  const q = [];
  const seeds = [
    [Math.floor(w * 0.48), Math.floor(h * 0.46)],
    [Math.floor(w * 0.52), Math.floor(h * 0.5)],
    [Math.floor(w * 0.5), Math.floor(h * 0.54)],
  ];
  for (const [sx, sy] of seeds) {
    const idx = sy * w + sx;
    if (!candidate[idx]) continue;
    if (ink[idx]) continue;
    ink[idx] = 1;
    q.push(idx);
  }
  while (q.length) {
    const idx = q.pop();
    const x = idx % w;
    const y = (idx - x) / w;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx;
      if (candidate[ni] && !ink[ni]) {
        ink[ni] = 1;
        q.push(ni);
      }
    }
  }
  return ink;
}

function bboxOf(mask, w, h) {
  let minx = w;
  let miny = h;
  let maxx = 0;
  let maxy = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) {
        if (x < minx) minx = x;
        if (y < miny) miny = y;
        if (x > maxx) maxx = x;
        if (y > maxy) maxy = y;
      }
    }
  }
  return { minx, miny, maxx, maxy };
}

async function monoReferencePng(_data, w, h, ink) {
  const out = Buffer.alloc(w * h * 4);
  const inkRgb = [0x14, 0x14, 0x12];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const o = idx * 4;
      if (ink[idx]) {
        out[o] = inkRgb[0];
        out[o + 1] = inkRgb[1];
        out[o + 2] = inkRgb[2];
        out[o + 3] = 255;
      } else {
        out[o + 3] = 0;
      }
    }
  }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

/** Monochrome bear only (no orb, no black square) for overlay checks. */
async function monoBearFromLogoPng(data, w, h, ink) {
  return monoReferencePng(data, w, h, ink);
}

async function main() {
  const target = 1254;
  const { data, info } = await sharp(LOGO)
    .resize(target, target, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const ink = buildInkMask(data, w, h);
  const { minx, miny, maxx, maxy } = bboxOf(ink, w, h);
  const pad = 4;
  const x0 = Math.max(0, minx - pad);
  const y0 = Math.max(0, miny - pad);
  const x1 = Math.min(w - 1, maxx + pad);
  const y1 = Math.min(h - 1, maxy + pad);
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;

  const pbm = writeP4(cw, ch, (x, y) => ink[(y0 + y) * w + (x0 + x)] === 1);
  const pbmPath = join(ARTIFACT_DIR, "advisor-ink.pbm");
  writeFileSync(pbmPath, pbm);

  const svgPath = join(ARTIFACT_DIR, "advisor-ink.svg");
  execSync(
    `potrace -s --turdsize 2 --opttolerance 0.1 --alphamax 0.0 -o "${svgPath}" "${pbmPath}"`,
    { stdio: "inherit" },
  );

  const svg = readFileSync(svgPath, "utf8");
  const viewBoxRaw = svg.match(/viewBox="([^"]+)"/)[1];
  const parts = viewBoxRaw.split(/\s+/).map((n) => parseFloat(n));
  const vbW = parts[2];
  const vbH = parts[3];
  const paths = [...svg.matchAll(/<path d="([^"]+)"/gs)].map((m) =>
    m[1].replace(/\s+/g, " ").trim(),
  );
  paths.sort((a, b) => b.length - a.length);

  const ts = `/** Auto-generated from public/logo.png — do not hand-edit. Run scripts/trace-advisor-mark-from-logo.mjs */
export const ADVISOR_BEAR_VIEWBOX = "0 0 ${vbW} ${vbH}";
export const ADVISOR_BEAR_TRACE_HEIGHT = ${Math.round(vbH)};
export const ADVISOR_BEAR_PATHS: string[] = ${JSON.stringify(paths, null, 2)};
`;
  writeFileSync(OUT_TS, ts);

  const refPng = await monoReferencePng(data, w, h, ink);
  writeFileSync(join(ARTIFACT_DIR, "mono-reference-from-logo.png"), refPng);
  await sharp(LOGO).resize(512, 512).png().toFile(join(ARTIFACT_DIR, "original-logo-512.png"));
  const monoBear = await monoBearFromLogoPng(data, w, h, ink);
  await sharp(monoBear).resize(512, 512).toFile(join(ARTIFACT_DIR, "mono-reference-512.png"));
  await sharp(monoBear).png().toFile(join(ARTIFACT_DIR, "mono-bear-from-logo.png"));

  console.log(`Wrote ${paths.length} paths, viewBox 0 0 ${vbW} ${vbH}`);
  console.log(`Updated ${OUT_TS}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
