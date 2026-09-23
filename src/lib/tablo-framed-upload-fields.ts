import type { FrameFinish } from "./types";

/** Multipart file field names per finish (first match wins). */
export const FRAMED_FINISH_UPLOAD_FIELDS: Record<FrameFinish, readonly string[]> = {
  bronze: ["framed-bronze", "framedBronze"],
  "matte-black-brushed": ["framed-matte-black-brushed", "framedMatteBlackBrushed"],
  "matte-steel-brushed": ["framed-matte-steel-brushed", "framedMatteSteelBrushed"],
};

/** Multipart clear flags per finish (`true` / `1`). */
export const FRAMED_FINISH_CLEAR_FIELDS: Record<FrameFinish, readonly string[]> = {
  bronze: ["clearFramed-bronze", "clearFramedBronze"],
  "matte-black-brushed": ["clearFramed-matte-black-brushed", "clearFramedMatteBlackBrushed"],
  "matte-steel-brushed": ["clearFramed-matte-steel-brushed", "clearFramedMatteSteelBrushed"],
};
