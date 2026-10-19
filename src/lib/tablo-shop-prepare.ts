import { normalizeTabloFrameFields } from "./frame-finish";
import { SHOP_SHIPPING_RATES } from "./shipping";
import { tabloHasMiniMockups } from "./tablo-mini-images";
import { tabloShopSizesForApi, type TabloShopSizeId } from "./tablo-sizes";
import type { ShopTablo, Tablo } from "./types";

function shopSizeIdsForTablo(slug: string): TabloShopSizeId[] {
  const ids: TabloShopSizeId[] = ["large"];
  if (tabloHasMiniMockups(slug)) ids.push("mini");
  return ids;
}

export function prepareShopTablo(tablo: Tablo): ShopTablo {
  const normalized = normalizeTabloFrameFields(tablo);
  return {
    ...normalized,
    sizes: tabloShopSizesForApi(shopSizeIdsForTablo(normalized.slug)),
    shipping: { ...SHOP_SHIPPING_RATES },
  };
}

export function prepareShopTablos(tablos: Tablo[]): ShopTablo[] {
  return tablos.map(prepareShopTablo);
}
