/** Public site copy — Improvisations in Berlin (Kaveh, Oct 2026). */
export const SITE_HERO_HEADLINE = "Improvisations in Berlin";
export const SITE_HERO_SUBLINE = "Moments I catch — some become framed prints.";
export const SITE_META_DESCRIPTION = SITE_HERO_SUBLINE;

/** Collection label for listed works (meta / bk-meta uppercase in UI). */
export const COLLECTION_NAME = "Improvisations";
export const COLLECTION_SHOP_INTRO = "Improvisations · framed prints";
export const COLLECTION_HOME_SECTION = "Improvisations";
export const COLLECTION_FOOTER = "Improvisations · Berlin";
export const COLLECTION_DETAIL_EYEBROW = "Improvisations · Berlin";
export const COLLECTION_SHOP_BACK = "← all improvisations";
export const COLLECTION_SHOP_EMPTY = "No improvisations listed yet — check back soon.";
export const COLLECTION_HOME_ALL_LINK = "all improvisations";

export const siteDocumentTitle = (segment?: string): string =>
  segment ? `${segment} · ${SITE_HERO_HEADLINE}` : SITE_HERO_HEADLINE;
