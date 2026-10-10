import type { Tablo } from "./types";

/** Growth-approved moment titles (slug → visible title). Slugs and stored `title` stay unchanged. */
const DISPLAY_TITLE_BY_SLUG: Record<string, string> = {
  "berlin-clouds-01": "One Contrail at Dusk",
  "berlin-sunset-02": "Ten Minutes of Orange",
  "berlin-sunset-03": "Berlin Goes Gold",
};

/** Prevent a line break before an em dash (bind dash to preceding word). */
export function tabloTitleWithBoundEmDash(title: string): string {
  return title.replace(/\s+—\s+/g, "\u00a0— ");
}

/** Stored catalog name (Blob / admin); used for SEO, alt text, and meta suffix. */
export function tabloCatalogTitle(tablo: Tablo): string {
  return tablo.title;
}

/** On-site headline for cards and detail H1. */
export function tabloVisibleTitle(tablo: Tablo): string {
  return DISPLAY_TITLE_BY_SLUG[tablo.slug] ?? tablo.title;
}

/** `<title>`, OG, and Twitter for a tablo detail page — display title plus catalog name. */
export function tabloMetaDocumentTitle(tablo: Tablo): string {
  const visible = DISPLAY_TITLE_BY_SLUG[tablo.slug];
  const catalog = tabloCatalogTitle(tablo);
  if (visible) {
    return `${visible} — ${catalog}`;
  }
  return catalog;
}

export function tabloDisplayTitleSlugs(): string[] {
  return Object.keys(DISPLAY_TITLE_BY_SLUG);
}

/** Alt text and share metadata: keep Berlin + catalog name, not the moment title alone. */
export function tabloImageAltSuffix(tablo: Tablo, kind: "framed" | "artwork" | "product"): string {
  const catalog = tabloCatalogTitle(tablo);
  if (kind === "framed") return `${catalog} — framed tablo on wall`;
  if (kind === "artwork") return `${catalog} — original artwork`;
  return `${catalog} — tablo artwork`;
}
