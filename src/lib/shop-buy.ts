import type { Tablo } from "./types";

const INSTAGRAM_BUY_FALLBACK = "https://instagram.com/berlinxkw";

export function tabloBuyUrl(tablo: Tablo): string {
  const url = tablo.marketplaceUrl?.trim();
  if (url) return url;
  return INSTAGRAM_BUY_FALLBACK;
}

export function tabloBuyLabel(tablo: Tablo): string {
  if (tablo.marketplaceUrl?.trim()) return "Buy now";
  return "Buy via DM";
}

export function tabloBuyExternal(tablo: Tablo): boolean {
  return Boolean(tablo.marketplaceUrl?.trim());
}
