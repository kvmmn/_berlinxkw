/** Public site copy — Improvisations in Berlin (Kaveh, Oct 2026). */
export const SITE_HERO_HEADLINE = "Improvisations in Berlin";
export const SITE_HERO_SUBLINE = "Moments I catch — some become framed prints.";
export const SITE_META_DESCRIPTION = SITE_HERO_SUBLINE;

export const siteDocumentTitle = (segment?: string): string =>
  segment ? `${segment} · ${SITE_HERO_HEADLINE}` : SITE_HERO_HEADLINE;
