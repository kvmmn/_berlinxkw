import { normalizeTabloFrameFields } from "./frame-finish";
import { SHOP_PUBLIC_FRAME_FINISH } from "./shop-public-frame-finish";
import { sanitizeTabloDescriptionForShop } from "./tablo-shop-description";
import { tabloHasMiniMockups } from "./tablo-mini-images";
import { TABLO_SHOP_MIN_PRICE_EUR, tabloShopSizesForApi, type TabloShopSizeId } from "./tablo-sizes";
import type { ShopTablo, Tablo } from "./types";

function shopSizeIdsForTablo(slug: string): TabloShopSizeId[] {
  const ids: TabloShopSizeId[] = ["large"];
  if (tabloHasMiniMockups(slug)) ids.push("mini");
  return ids;
}

export function prepareShopTablo(tablo: Tablo): ShopTablo {
  const normalized = normalizeTabloFrameFields(tablo);
  const sizes = tabloShopSizesForApi(shopSizeIdsForTablo(normalized.slug));
  return {
    ...normalized,
    sizes,
    priceEur: TABLO_SHOP_MIN_PRICE_EUR,
    frameFinishes: [SHOP_PUBLIC_FRAME_FINISH],
    defaultFrameFinish: SHOP_PUBLIC_FRAME_FINISH,
    description: sanitizeTabloDescriptionForShop(normalized.description),
  };
}

export function prepareShopTablos(tablos: Tablo[]): ShopTablo[] {
  return tablos.map(prepareShopTablo);
}
