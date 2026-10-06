#!/usr/bin/env node
/**
 * Sample 2% edge strips from shop mockups, normalize stage tones (≤2 ΔE), emit JSON.
 * Usage: node scripts/build-tablo-grid-wall-config.mjs
 */
import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { join } from "path";

const SHOP = "https://berlinxkw.vercel.app/api/shop";
const STRIP_FRAC = 0.02;

const SLUG_URLS = [
  {
    slug: "berlin-clouds-01",
    path: "berlinxkw/tablos/tablo-de9e3e35-cd5a-4d19-8f4d-5fb3bbf9691f/framed/berlin-clouds-01-bronze-50x70-v4.jpg",
  },
  {
    slug: "berlin-sunset-2",
    path: "berlinxkw/tablos/tablo-bd06a564-833d-43a7-abea-c26a8fd9d5d0/framed/berlin-sunset-02-bronze-50x70-v4.jpg",
  },
  {
    slug: "berlin-sunset-3",
    path: "berlinxkw/tablos/tablo-8c0b8c6f-5bff-44a0-9dff-44a74afe9acd/framed/berlin-sunset-03-bronze-50x70-v4.jpg",
  },
];

function mediaUrl(pathname) {
  return `${SHOP.replace("/api/shop", "")}/api/shop/media?pathname=${encodeURIComponent(pathname)}`;
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
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

function mix(a, b, t) {
  return {
    r: a.r * (1 - t) + b.r * t,
    g: a.g * (1 - t) + b.g * t,
    b: a.b * (1 - t) + b.b * t,
  };
}

function meanRgb(list) {
  const sum = list.reduce((acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }), { r: 0, g: 0, b: 0 });
  return { r: sum.r / list.length, g: sum.g / list.length, b: sum.b / list.length };
}

async function sampleEdges(page, dataUrl) {
  return page.evaluate(
    async ({ dataUrl, stripFrac }) => {
      function isBronze(r, g, b) {
        return r > 150 && g > 100 && b < 130 && r > g && g > b + 10 && r - g < 80;
      }
      function meanStrip(rs, gs, bs) {
        if (rs.length === 0) return null;
        const med = (arr) => {
          const s = [...arr].sort((x, y) => x - y);
          return s[Math.floor(s.length / 2)] ?? 0;
        };
        return { r: med(rs), g: med(gs), b: med(bs) };
      }
      function collect(img, pred) {
        const rs = [];
        const gs = [];
        const bs = [];
        const { width, height, data } = img;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (!pred(x, y, width, height)) continue;
            const i = (width * y + x) * 4;
            if (data[i + 3] < 48) continue;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (isBronze(r, g, b)) continue;
            rs.push(r);
            gs.push(g);
            bs.push(b);
          }
        }
        return meanStrip(rs, gs, bs);
      }
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const bmp = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(bmp.width, bmp.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bmp, 0, 0);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const w = img.width;
      const h = img.height;
      const t = Math.max(2, Math.floor(h * stripFrac));
      const lr = Math.max(2, Math.floor(w * stripFrac));
      const top = collect(img, (x, y) => y < t);
      const bottom = collect(img, (x, y) => y >= h - t);
      const left = collect(img, (x, y) => x < lr);
      const right = collect(img, (x, y) => x >= w - lr);
      const t0 = Math.floor(h * 0.02);
      const t1 = Math.floor(h * 0.1);
      const b0 = Math.floor(h * 0.9);
      const b1 = h - Math.floor(h * 0.02);
      const topWall = collect(img, (x, y) => y >= t0 && y < t1);
      const bottomWall = collect(img, (x, y) => y >= b0 && y < b1);
      return { top, bottom, left, right, topWall, bottomWall, width: w, height: h };
    },
    { dataUrl, stripFrac: STRIP_FRAC },
  );
}

function mockupFilterForMid(mid, targetRgb) {
  const midLab = rgbToLab(mid);
  const targetLab = rgbToLab(targetRgb);
  const dE = deltaE(mid, targetRgb);
  if (dE <= 2) return undefined;
  const bright = 1 + (targetLab.L - midLab.L) / 120;
  const sat = 1 - (midLab.a - targetLab.a) / 300;
  const b = Math.max(0.94, Math.min(1.08, bright));
  const s = Math.max(0.88, Math.min(1.05, sat));
  if (Math.abs(b - 1) < 0.008 && Math.abs(s - 1) < 0.008) return undefined;
  return `brightness(${b.toFixed(3)}) saturate(${s.toFixed(3)})`;
}

function normalizeSlugs(raw) {
  const target = meanRgb(
    raw.flatMap((s) => [hexToRgb(s.top), hexToRgb(s.bottom), hexToRgb(s.left), hexToRgb(s.right)]),
  );

  const rawMids = raw.map((s) =>
    meanRgb([hexToRgb(s.top), hexToRgb(s.bottom), hexToRgb(s.left), hexToRgb(s.right)]),
  );

  let items = raw.map((s) => ({
    slug: s.slug,
    edges: {
      top: hexToRgb(s.top),
      bottom: hexToRgb(s.bottom),
      left: hexToRgb(s.left),
      right: hexToRgb(s.right),
    },
  }));

  for (let iter = 0; iter < 48; iter++) {
    const mids = items.map((it) => meanRgb([it.edges.top, it.edges.bottom]));
    let maxPair = 0;
    for (let i = 0; i < mids.length; i++) {
      for (let j = i + 1; j < mids.length; j++) {
        maxPair = Math.max(maxPair, deltaE(mids[i], mids[j]));
      }
    }
    if (maxPair <= 2) break;
    items = items.map((it) => ({
      ...it,
      edges: {
        top: mix(it.edges.top, target, 0.12),
        bottom: mix(it.edges.bottom, target, 0.12),
        left: mix(it.edges.left, target, 0.12),
        right: mix(it.edges.right, target, 0.12),
      },
    }));
  }

  const lift = (rgb) => mix(rgb, { r: 255, g: 255, b: 255 }, 0.035);

  return {
    target: rgbToHex(target),
    items: items.map((it, index) => {
      const horizontalBlend = deltaE(it.edges.left, it.edges.right) > 2;
      const stageMid = meanRgb([it.edges.top, it.edges.bottom]);
      const filterFromRaw = mockupFilterForMid(rawMids[index], target);
      const filterFromStage = mockupFilterForMid(stageMid, target);
      return {
        slug: it.slug,
        top: rgbToHex(lift(it.edges.top)),
        bottom: rgbToHex(lift(it.edges.bottom)),
        left: rgbToHex(it.edges.left),
        right: rgbToHex(it.edges.right),
        horizontalBlend,
        mockupFilter: filterFromRaw ?? filterFromStage,
      };
    }),
  };
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const raw = [];
  for (const entry of SLUG_URLS) {
    const url = mediaUrl(entry.path);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} ${res.status}`);
    const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    const dataUrl = `data:image/jpeg;base64,${b64}`;
    const edges = await sampleEdges(page, dataUrl);
    const pickTop = edges.topWall ?? edges.top;
    const pickBottom = edges.bottomWall ?? edges.bottom;
    raw.push({
      slug: entry.slug,
      top: rgbToHex(pickTop),
      bottom: rgbToHex(pickBottom),
      left: rgbToHex(edges.left),
      right: rgbToHex(edges.right),
    });
  }
  await browser.close();

  const config = normalizeSlugs(raw);
  const outPath = join(process.cwd(), "src/lib/tablo-grid-wall-config.json");
  writeFileSync(outPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(JSON.stringify(config, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
