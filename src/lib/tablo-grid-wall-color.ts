export type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return { r: 230, g: 222, b: 212 };
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
}

export function rgbToLab({ r, g, b }: Rgb): { L: number; a: number; b: number } {
  const sr = r / 255;
  const sg = g / 255;
  const sb = b / 255;
  const f = (u: number) => (u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4);
  const R = f(sr);
  const G = f(sg);
  const B = f(sb);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.0;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const ff = (t: number) => (t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116);
  const fx = ff(x);
  const fy = ff(y);
  const fz = ff(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

export function deltaE76(c1: Rgb, c2: Rgb): number {
  const l1 = rgbToLab(c1);
  const l2 = rgbToLab(c2);
  return Math.hypot(l1.L - l2.L, l1.a - l2.a, l1.b - l2.b);
}

export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const w = Math.max(0, Math.min(1, t));
  return {
    r: a.r * (1 - w) + b.r * w,
    g: a.g * (1 - w) + b.g * w,
    b: a.b * (1 - w) + b.b * w,
  };
}

export function meanRgb(colors: Rgb[]): Rgb {
  if (colors.length === 0) return { r: 230, g: 222, b: 212 };
  const sum = colors.reduce(
    (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }),
    { r: 0, g: 0, b: 0 },
  );
  return {
    r: sum.r / colors.length,
    g: sum.g / colors.length,
    b: sum.b / colors.length,
  };
}
