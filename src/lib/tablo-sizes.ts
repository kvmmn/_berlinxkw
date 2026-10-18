import type { TabloOrientation } from "./tablo-frame-spec";
import type { TabloShopSizeId } from "./types";

export type { TabloShopSizeId };

export type TabloShopSizeConfig = {
  id: TabloShopSizeId;
  label: string;
  labelFa: string;
  shortCm: number;
  longCm: number;
  mat: boolean;
  priceEur: number;
};

export const TABLO_SHOP_SIZE_LARGE: TabloShopSizeConfig = {
  id: "large",
  label: "Large",
  labelFa: "بزرگ",
  shortCm: 50,
  longCm: 70,
  mat: true,
  priceEur: 89,
};

export const TABLO_SHOP_SIZE_MINI: TabloShopSizeConfig = {
  id: "mini",
  label: "Mini",
  labelFa: "مینی",
  shortCm: 30,
  longCm: 40,
  mat: false,
  priceEur: 59,
};

export const TABLO_SHOP_SIZES: readonly TabloShopSizeConfig[] = [
  TABLO_SHOP_SIZE_LARGE,
  TABLO_SHOP_SIZE_MINI,
] as const;

export const TABLO_SHOP_MIN_PRICE_EUR = TABLO_SHOP_SIZE_MINI.priceEur;
export const TABLO_SHOP_MAX_PRICE_EUR = TABLO_SHOP_SIZE_LARGE.priceEur;

export type TabloShopSizeApi = {
  id: TabloShopSizeId;
  label: string;
  dimensions: { shortCm: number; longCm: number };
  mat: boolean;
  priceEur: number;
};

export function tabloShopSizeToApi(size: TabloShopSizeConfig): TabloShopSizeApi {
  return {
    id: size.id,
    label: size.label,
    dimensions: { shortCm: size.shortCm, longCm: size.longCm },
    mat: size.mat,
    priceEur: size.priceEur,
  };
}

export function tabloShopSizesForApi(sizeIds: TabloShopSizeId[]): TabloShopSizeApi[] {
  return TABLO_SHOP_SIZES.filter((s) => sizeIds.includes(s.id)).map(tabloShopSizeToApi);
}

export function tabloShopSizeById(id: TabloShopSizeId): TabloShopSizeConfig {
  return id === "mini" ? TABLO_SHOP_SIZE_MINI : TABLO_SHOP_SIZE_LARGE;
}

export function tabloSizeDimensionsForOrientation(
  sizeId: TabloShopSizeId,
  orientation: TabloOrientation,
): { widthCm: number; heightCm: number; aspectRatio: string } {
  const size = tabloShopSizeById(sizeId);
  if (orientation === "landscape") {
    return {
      widthCm: size.longCm,
      heightCm: size.shortCm,
      aspectRatio: `${size.longCm} / ${size.shortCm}`,
    };
  }
  return {
    widthCm: size.shortCm,
    heightCm: size.longCm,
    aspectRatio: `${size.shortCm} / ${size.longCm}`,
  };
}

export function tabloSizeFrameLabel(sizeId: TabloShopSizeId, orientation: TabloOrientation): string {
  const { widthCm, heightCm } = tabloSizeDimensionsForOrientation(sizeId, orientation);
  return `${widthCm}×${heightCm} cm`;
}

export function tabloSizeMatLabel(sizeId: TabloShopSizeId): { en: string; fa: string } {
  return sizeId === "large"
    ? { en: "with mat", fa: "با پاسپارت" }
    : { en: "no mat", fa: "بدون پاسپارت" };
}

export function formatShopPriceEur(price: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function shopGridPriceLabel(): string {
  return `from ${formatShopPriceEur(TABLO_SHOP_MIN_PRICE_EUR)}`;
}