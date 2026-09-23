const SHOP_LINK_PLACEHOLDER = "{shopLink}";

export function slugifyTablo(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function getSiteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export function shopListingUrl(slug: string): string {
  return `${getSiteOrigin()}/shop/${slug}`;
}

export function defaultCaptionDraft(title: string): string {
  return `${title} · original tablo · available now · ${SHOP_LINK_PLACEHOLDER}`;
}

export function fillCaptionDraft(captionDraft: string, slug: string): string {
  return captionDraft.replaceAll(SHOP_LINK_PLACEHOLDER, shopListingUrl(slug));
}

export { SHOP_LINK_PLACEHOLDER };
