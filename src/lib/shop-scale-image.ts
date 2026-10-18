import fs from "node:fs";
import path from "node:path";

export const SHOP_SCALE_IMAGE_PUBLIC_PATH = "/shop-scale/scale.png";

/** True when `public/shop-scale/scale.png` is present (optional catalog asset). */
export function shopScaleImageAvailable(cwd: string = process.cwd()): boolean {
  return fs.existsSync(path.join(cwd, "public", "shop-scale", "scale.png"));
}
