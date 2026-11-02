/** Public shop shipping rates (Germany + EU), fixed in code. */
export const SHOP_SHIPPING_GERMANY_EUR = 7.9;
export const SHOP_SHIPPING_EU_EUR = 17.9;

export type ShopShippingRates = {
  germanyEur: number;
  euEur: number;
};

export const SHOP_SHIPPING_RATES: ShopShippingRates = {
  germanyEur: SHOP_SHIPPING_GERMANY_EUR,
  euEur: SHOP_SHIPPING_EU_EUR,
};

export function formatShippingEurEnglish(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

export function shopShippingLineLabel(): string {
  return `Shipping: Germany ${formatShippingEurEnglish(SHOP_SHIPPING_GERMANY_EUR)} · EU ${formatShippingEurEnglish(SHOP_SHIPPING_EU_EUR)}`;
}
