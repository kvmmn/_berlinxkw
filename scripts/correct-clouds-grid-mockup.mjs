#!/usr/bin/env node
/**
 * Wall-only colour correction for Clouds 01 grid mockup (preserves frame, mat, art, cast shadow).
 * Output: public/shop/grid/berlin-clouds-01-bronze-grid-wall-v1.jpg
 */
import sharp from "sharp";
import { mkdirSync } from "fs";
import { dirname, join } from "path";

const SOURCE_PATH =
  "berlinxkw/tablos/tablo-de9e3e35-cd5a-4d19-8f4d-5fb3bbf9691f/framed/berlin-clouds-01-bronze-50x70-v4.jpg";
const OUT = join(process.cwd(), "public/shop/grid/berlin-clouds-01-bronze-grid-wall-v1.jpg");

const TOP = { r: 0xe0, g: 0xd9, b: 0xcc };
const BOTTOM = { r: 0xde, g: 0xd5, b: 0xca };
const LEFT = { r: 0xe2, g: 0xda, b: 0xce };
const RIGHT = { r: 0xda, g: 0xd0, b: 0xc3 };

const LANDSCAPE_FRAME = { w: 1627 / 2400, h: 1228 / 1790 };

function isBronze(r, g, b) {
  return r > 150 && g > 100 && b < 130 && r > g && g > b + 10 && r - g < 80;
}

function rgbToLab(r, g, b) {
  const f = (u) => (u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4);
  const R = f(r / 255);
  const G = f(g / 255);
  const B = f(b / 255);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.0;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const ff = (t) => (t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116);
  const fx = ff(x);
  const fy = ff(y);
  const fz = ff(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

function labToRgb(L, a, b) {
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const inv = (t) => {
    const t3 = t ** 3;
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
  };
  const x = inv(fx) * 0.95047;
  const y = inv(fy) * 1.0;
  const z = inv(fz) * 1.08883;
  const R = x * 3.2406 + y * -1.5372 + z * -0.4986;
  const G = x * -0.9689 + y * 1.8758 + z * 0.0415;
  const B = x * 0.0557 + y * -0.204 + z * 1.057;
  const comp = (u) => {
    const c = u <= 0.0031308 ? 12.92 * u : 1.055 * u ** (1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(c * 255)));
  };
  return { r: comp(R), g: comp(G), b: comp(B) };
}

function mixRgb(a, b, t) {
  const w = Math.max(0, Math.min(1, t));
  return {
    r: a.r * (1 - w) + b.r * w,
    g: a.g * (1 - w) + b.g * w,
    b: a.b * (1 - w) + b.b * w,
  };
}

function targetRgb(x, y, width, height) {
  const ty = y / Math.max(1, height - 1);
  const tx = x / Math.max(1, width - 1);
  const vertical = mixRgb(TOP, BOTTOM, ty);
  const horizontal = mixRgb(LEFT, RIGHT, tx);
  return mixRgb(vertical, horizontal, 0.22);
}

async function main() {
  const url = `https://berlinxkw.vercel.app/api/shop/media?pathname=${encodeURIComponent(SOURCE_PATH)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());

  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const frameW = width * LANDSCAPE_FRAME.w;
  const frameH = height * LANDSCAPE_FRAME.h;
  const frameLeft = (width - frameW) / 2;
  const frameTop = (height - frameH) / 2;
  const frameRight = frameLeft + frameW;
  const frameBottom = frameTop + frameH;
  const shadowEnd = frameBottom + height * 0.14;

  const out = Buffer.from(data);
  let wallCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (isBronze(r, g, b)) continue;

      const insideFrame =
        x >= frameLeft && x <= frameRight && y >= frameTop && y <= frameBottom;
      if (insideFrame) continue;

      const tgt = targetRgb(x, y, width, height);
      let strength = 0.94;

      if (y >= frameBottom - 2 && y <= shadowEnd) {
        const rel = Math.max(0, Math.min(1, (y - (frameBottom - 2)) / (shadowEnd - frameBottom + 2)));
        const origL = rgbToLab(r, g, b).L;
        const tgtL = rgbToLab(tgt.r, tgt.g, tgt.b).L;
        if (origL < tgtL - 2) {
          strength *= Math.max(0.08, 1 - rel * 0.92);
        }
      }

      const origLab = rgbToLab(r, g, b);
      const tgtLab = rgbToLab(tgt.r, tgt.g, tgt.b);
      const newLab = {
        L: origLab.L + (tgtLab.L - origLab.L) * strength,
        a: origLab.a + (tgtLab.a - origLab.a) * strength,
        b: origLab.b + (tgtLab.b - origLab.b) * strength,
      };
      const corrected = labToRgb(newLab.L, newLab.a, newLab.b);
      out[i] = corrected.r;
      out[i + 1] = corrected.g;
      out[i + 2] = corrected.b;
      wallCount++;
    }
  }

  mkdirSync(dirname(OUT), { recursive: true });
  await sharp(out, { raw: { width, height, channels } })
    .jpeg({ quality: 94, mozjpeg: true })
    .toFile(OUT);

  console.log(JSON.stringify({ out: OUT, width, height, wallPixels: wallCount }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
