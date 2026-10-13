/** Public site copy — Improvisations in Berlin (Kaveh, Oct 2026). */
export const SITE_HERO_HEADLINE = "Improvisations in Berlin";
export const SITE_HERO_SUBLINE = "Moments I catch — some become framed prints.";
export const SITE_META_DESCRIPTION = SITE_HERO_SUBLINE;

/** Collection / shop chrome — neutral labels (brand line lives in hero only). */
export const COLLECTION_NAME = "Framed prints";
export const COLLECTION_SHOP_INTRO = "Framed prints";
export const COLLECTION_HOME_SECTION = "listed tablos";
export const COLLECTION_FOOTER = "original works · berlin";
export const COLLECTION_DETAIL_EYEBROW = "original tablo · berlin";
export const COLLECTION_SHOP_BACK = "← all tablos";
export const COLLECTION_SHOP_EMPTY = "No listed tablos yet — check back soon.";
export const COLLECTION_HOME_ALL_LINK = "all works";

export const siteDocumentTitle = (segment?: string): string =>
  segment ? `${segment} · ${SITE_HERO_HEADLINE}` : SITE_HERO_HEADLINE;
