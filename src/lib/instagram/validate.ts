import {
  ASPECT_RATIO_MAX,
  ASPECT_RATIO_MIN,
  CAPTION_MAX_LENGTH,
  CAROUSEL_MAX_ITEMS,
  CAROUSEL_MIN_ITEMS,
  HASHTAG_MAX_COUNT,
} from "./constants";
import { jpegDimensionsFromBuffer } from "./jpeg-dimensions";

export type ImageValidationResult = {
  url: string;
  ok: boolean;
  errors: string[];
  contentType?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
};

export type PublishValidationResult = {
  ok: boolean;
  caption: { ok: boolean; errors: string[]; length: number; hashtagCount: number };
  images: ImageValidationResult[];
  errors: string[];
};

export function countHashtags(caption: string): number {
  const matches = caption.match(/#[\p{L}\p{N}_]+/gu);
  return matches?.length ?? 0;
}

export function validateCaption(caption: string): { ok: boolean; errors: string[]; length: number; hashtagCount: number } {
  const errors: string[] = [];
  const length = caption.length;
  const hashtagCount = countHashtags(caption);

  if (length > CAPTION_MAX_LENGTH) {
    errors.push(`Caption exceeds ${CAPTION_MAX_LENGTH} characters (${length}).`);
  }
  if (hashtagCount > HASHTAG_MAX_COUNT) {
    errors.push(`Caption has ${hashtagCount} hashtags; maximum is ${HASHTAG_MAX_COUNT}.`);
  }

  return { ok: errors.length === 0, errors, length, hashtagCount };
}

function aspectOk(width: number, height: number): boolean {
  const ratio = width / height;
  return ratio >= ASPECT_RATIO_MIN && ratio <= ASPECT_RATIO_MAX;
}

export async function validateImageUrl(url: string): Promise<ImageValidationResult> {
  const errors: string[] = [];

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { url, ok: false, errors: ["Invalid URL."] };
  }

  if (parsed.protocol !== "https:") {
    errors.push("Image URL must use HTTPS.");
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: { Range: "bytes=0-65535" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { url, ok: false, errors: [`Could not fetch image: ${msg}.`] };
  }

  if (!res.ok && res.status !== 206) {
    errors.push(`Image URL returned HTTP ${res.status}.`);
    return { url, ok: false, errors };
  }

  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (contentType !== "image/jpeg") {
    errors.push(`Content-Type must be image/jpeg (got ${contentType || "unknown"}).`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const dims = jpegDimensionsFromBuffer(buf);
  if (!dims) {
    errors.push("Could not read JPEG dimensions (invalid or truncated file).");
    return { url, ok: false, errors, contentType };
  }

  const aspectRatio = Math.round((dims.width / dims.height) * 1000) / 1000;
  if (!aspectOk(dims.width, dims.height)) {
    errors.push(
      `Aspect ratio ${aspectRatio} is outside Instagram feed limits (${ASPECT_RATIO_MIN}–${ASPECT_RATIO_MAX}).`,
    );
  }

  return {
    url,
    ok: errors.length === 0,
    errors,
    contentType,
    width: dims.width,
    height: dims.height,
    aspectRatio,
  };
}

export async function validatePublishPayload(
  imageUrls: string[],
  caption: string,
): Promise<PublishValidationResult> {
  const errors: string[] = [];
  const captionResult = validateCaption(caption);

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    errors.push("imageUrls must be a non-empty array.");
    return {
      ok: false,
      caption: captionResult,
      images: [],
      errors,
    };
  }

  if (imageUrls.length > CAROUSEL_MAX_ITEMS) {
    errors.push(`At most ${CAROUSEL_MAX_ITEMS} images allowed.`);
  }
  if (imageUrls.length > 1 && imageUrls.length < CAROUSEL_MIN_ITEMS) {
    errors.push(`Carousels require at least ${CAROUSEL_MIN_ITEMS} images.`);
  }

  if (!captionResult.ok) {
    errors.push(...captionResult.errors);
  }

  const images = await Promise.all(imageUrls.map((u) => validateImageUrl(String(u).trim())));

  for (const img of images) {
    if (!img.ok) errors.push(...img.errors.map((e) => `${img.url}: ${e}`));
  }

  return {
    ok: errors.length === 0,
    caption: captionResult,
    images,
    errors,
  };
}
