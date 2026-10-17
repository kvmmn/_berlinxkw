import type { FrameFinish } from "./types";

const MINI_MOCKUP_SLUGS = new Set([
  "berlin-clouds-01",
  "berlin-sunset-02",
  "berlin-sunset-03",
  "tablo-04",
]);

const FINISH_FILENAME: Record<FrameFinish, string> = {
  bronze: "framed-bronze.jpg",
  "matte-black-brushed": "framed-matte-black-brushed.jpg",
  "matte-steel-brushed": "framed-matte-steel-brushed.jpg",
};

export function tabloHasMiniMockups(slug: string): boolean {
  return MINI_MOCKUP_SLUGS.has(slug);
}

/** Static path under public/shop-mini when assets exist for slug + finish. */
export function tabloMiniFramedImagePath(slug: string, finish: FrameFinish): string | undefined {
  if (!tabloHasMiniMockups(slug)) return undefined;
  const file = FINISH_FILENAME[finish];
  return `/shop-mini/${slug}/${file}`;
}
