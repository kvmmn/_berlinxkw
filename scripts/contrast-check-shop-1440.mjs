#!/usr/bin/env node
/**
 * 4× contrast crop of shop grid + stage ΔE report.
 * Usage: node scripts/contrast-check-shop-1440.mjs <screenshot.png> [out-contrast.png]
 */
import { readFileSync, writeFileSync } from "fs";
import { PNG } from "pngjs";
import { join } from "path";

const input = process.argv[2] || "/opt/cursor/artifacts/screenshots/after-shop-1440.png";
const output =
  process.argv[3] || join(process.cwd(), "/opt/cursor/artifacts/screenshots/contrast-check-1440.png");

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function rgbToLab({ r, g, b }) {
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

function deltaE(c1, c2) {
  const l1 = rgbToLab(c1);
  const l2 = rgbToLab(c2);
  return Math.hypot(l1.L - l2.L, l1.a - l2.a, l1.b - l2.b);
}

function contrast4(v) {
  return Math.max(0, Math.min(255, (v - 128) * 4 + 128));
}

function meanRect(png, x0, y0, w, h) {
  const { width, data } = png;
  let rs = 0;
  let gs = 0;
  let bs = 0;
  let n = 0;
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const i = (width * y + x) * 4;
      rs += data[i];
      gs += data[i + 1];
      bs += data[i + 2];
      n++;
    }
  }
  return { r: rs / n, g: gs / n, b: bs / n };
}

function main() {
  const buf = readFileSync(input);
  const png = PNG.sync.read(buf);
  const out = new PNG({ width: png.width, height: png.height });
  for (let i = 0; i < png.data.length; i += 4) {
    out.data[i] = contrast4(png.data[i]);
    out.data[i + 1] = contrast4(png.data[i + 1]);
    out.data[i + 2] = contrast4(png.data[i + 2]);
    out.data[i + 3] = png.data[i + 3];
  }
  writeFileSync(output, PNG.sync.write(out));

  // Stage samples: approximate y band of first row stages (1440 shop layout)
  const samples = [
    { name: "clouds-stage", x: 80, y: 130, w: 120, h: 40 },
    { name: "sunset2-stage", x: 520, y: 130, w: 120, h: 40 },
    { name: "sunset3-stage", x: 960, y: 130, w: 120, h: 40 },
  ];
  const colors = samples.map((s) => ({ name: s.name, rgb: meanRect(png, s.x, s.y, s.w, s.h) }));
  const pairs = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      pairs.push({
        a: colors[i].name,
        b: colors[j].name,
        deltaE: Math.round(deltaE(colors[i].rgb, colors[j].rgb) * 100) / 100,
      });
    }
  }
  console.log(
    JSON.stringify(
      {
        input,
        output,
        stageSampleDeltaE: pairs,
        maxDeltaE: Math.max(...pairs.map((p) => p.deltaE)),
      },
      null,
      2,
    ),
  );
}

main();
