#!/usr/bin/env node
/**
 * Sample median wall tone from mockup JPEG border pixels (excludes bronze frame band).
 * Usage: node scripts/sample-tablo-grid-wall-tones.mjs <imageUrl> [imageUrl...]
 */
import { chromium } from "playwright";

function isBronze(r, g, b) {
  return r > 150 && g > 100 && b < 130 && r > g && g > b + 10 && r - g < 80;
}

function sampleBorderWallFromRgba(width, height, data, borderPx = 24) {
  const rs = [];
  const gs = [];
  const bs = [];
  const push = (x, y) => {
    const i = (width * y + x) * 4;
    const a = data[i + 3];
    if (a < 48) return;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isBronze(r, g, b)) return;
    rs.push(r);
    gs.push(g);
    bs.push(b);
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const onBorder =
        x < borderPx || x >= width - borderPx || y < borderPx || y >= height - borderPx;
      if (onBorder) push(x, y);
    }
  }
  if (rs.length === 0) return null;
  const med = (arr) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  const r = med(rs);
  const g = med(gs);
  const b = med(bs);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

async function sampleUrl(page, dataUrl) {
  return page.evaluate(
    async ({ dataUrl, borderPx }) => {
      function isBronze(r, g, b) {
        return r > 150 && g > 100 && b < 130 && r > g && g > b + 10 && r - g < 80;
      }
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const bmp = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(bmp.width, bmp.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bmp, 0, 0);
      const { width, height } = canvas;
      const img = ctx.getImageData(0, 0, width, height);
      const rs = [];
      const gs = [];
      const bs = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const onBorder =
            x < borderPx || x >= width - borderPx || y < borderPx || y >= height - borderPx;
          if (!onBorder) continue;
          const i = (width * y + x) * 4;
          const a = img.data[i + 3];
          if (a < 48) continue;
          const r = img.data[i];
          const g = img.data[i + 1];
          const b = img.data[i + 2];
          if (isBronze(r, g, b)) continue;
          rs.push(r);
          gs.push(g);
          bs.push(b);
        }
      }
      const med = (arr) => {
        const s = [...arr].sort((a, b) => a - b);
        return s[Math.floor(s.length / 2)] ?? 0;
      };
      const r = med(rs);
      const g = med(gs);
      const b = med(bs);
      const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
      return { width, height, hex, samples: rs.length };
    },
    { dataUrl, borderPx: 32 },
  );
}

async function main() {
  const urls = process.argv.slice(2);
  if (urls.length === 0) {
    console.error("Pass at least one image URL");
    process.exit(1);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const url of urls) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} ${res.status}`);
    const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    const dataUrl = `data:${mime};base64,${b64}`;
    const result = await sampleUrl(page, dataUrl);
    console.log(JSON.stringify({ url, wallTone: result.hex, samples: result.samples }));
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
