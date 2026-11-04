import fs from "node:fs";
import path from "node:path";
import type { TabloOrientation } from "./tablo-frame-spec";

export const SHOP_SCALE_IMAGE_PORTRAIT_PATH = "/shop-scale/scale.png";
export const SHOP_SCALE_IMAGE_LANDSCAPE_PATH = "/shop-scale/scale-landscape.png";

const SCALE_FILES: Record<TabloOrientation, { publicPath: string; relativePath: string }> = {
  portrait: {
    publicPath: SHOP_SCALE_IMAGE_PORTRAIT_PATH,
    relativePath: "shop-scale/scale.png",
  },
  landscape: {
    publicPath: SHOP_SCALE_IMAGE_LANDSCAPE_PATH,
    relativePath: "shop-scale/scale-landscape.png",
  },
};

function scaleImageExists(relativePath: string, cwd: string): boolean {
  return fs.existsSync(path.join(cwd, "public", relativePath));
}

/** Public URL for the scale illustration matching tablo orientation, or undefined if missing. */
export function shopScaleImagePathForOrientation(
  orientation: TabloOrientation,
  cwd: string = process.cwd(),
): string | undefined {
  const entry = SCALE_FILES[orientation];
  return scaleImageExists(entry.relativePath, cwd) ? entry.publicPath : undefined;
}

export function shopScaleImageAltForOrientation(orientation: TabloOrientation): string {
  const layout = orientation === "landscape" ? "landscape" : "portrait";
  return `Scale reference (${layout}) — console, large and mini frames, 175 cm person`;
}

/** @deprecated Use shopScaleImagePathForOrientation. */
export function shopScaleImageAvailable(cwd: string = process.cwd()): boolean {
  return scaleImageExists(SCALE_FILES.portrait.relativePath, cwd);
}
