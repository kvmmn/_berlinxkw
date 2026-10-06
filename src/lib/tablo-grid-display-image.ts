import { tabloProductImage } from "./tablo-images";
import { tabloDefaultFrameFinish } from "./frame-finish";
import type { FrameFinish, Tablo, TabloImage } from "./types";

/** Grid-only mockups (shop product / detail assets unchanged). */
const GRID_MOCKUP_URL_BY_SLUG: Record<string, string> = {
  "berlin-clouds-01": "/shop/grid/berlin-clouds-01-bronze-grid-wall-v1.jpg",
};

export function tabloGridDisplayImage(tablo: Tablo, finish?: FrameFinish): TabloImage | null {
  const base = tabloProductImage(tablo, finish ?? tabloDefaultFrameFinish(tablo));
  const gridUrl = GRID_MOCKUP_URL_BY_SLUG[tablo.slug];
  if (!gridUrl || !base) return base;
  return {
    ...base,
    url: gridUrl,
    pathname: undefined,
    mime: "image/jpeg",
  };
}
