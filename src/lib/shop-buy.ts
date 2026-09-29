import { FRAME_FINISH_LABELS } from "./frame-finish";
import type { FrameFinish, Tablo } from "./types";

const INSTAGRAM_BUY_FALLBACK = "https://instagram.com/berlinxkw";

function appendFrameFinishQuery(base: string, finish: FrameFinish): string {
  try {
    const u = new URL(base);
    u.searchParams.set("frameFinish", finish);
    return u.toString();
  } catch {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}frameFinish=${encodeURIComponent(finish)}`;
  }
}

export function tabloBuyUrl(tablo: Tablo, finish?: FrameFinish): string {
  const url = tablo.marketplaceUrl?.trim();
  const base = url || INSTAGRAM_BUY_FALLBACK;
  if (!finish) return base;
  return appendFrameFinishQuery(base, finish);
}

export function tabloBuyLabel(tablo: Tablo): string {
  if (tablo.marketplaceUrl?.trim()) return "Buy now";
  return "Buy via DM";
}

export function tabloBuyExternal(tablo: Tablo): boolean {
  return Boolean(tablo.marketplaceUrl?.trim());
}

export function tabloBuyFinishNote(tablo: Tablo, finish: FrameFinish, external: boolean): string {
  const label = FRAME_FINISH_LABELS[finish];
  if (external) {
    return `If the shop link omits finish, choose ${label.en} at checkout.`;
  }
  if (tablo.marketplaceUrl?.trim()) {
    return `Finish is in the link when supported — else note ${label.en}.`;
  }
  return `DM @berlinxkw — finish: ${label.en} (${label.fa}).`;
}
