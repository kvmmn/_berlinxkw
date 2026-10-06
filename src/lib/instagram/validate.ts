import {
  ASPECT_RATIO_MAX,
  ASPECT_RATIO_MIN,
  CAPTION_MAX_LENGTH,
  CAROUSEL_MAX_ITEMS,
  CAROUSEL_MIN_ITEMS,
  HASHTAG_MAX_COUNT,
  REELS_VIDEO_CONTENT_TYPES,
  REELS_VIDEO_MAX_BYTES,
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

export type VideoValidationResult = {
  url: string;
  ok: boolean;
  errors: string[];
  contentType?: string;
  contentLength?: number;
};

export type ReelsValidationResult = {
  ok: boolean;
  mediaType: "REELS";
  caption: { ok: boolean; errors: string[]; length: number; hashtagCount: number };
  video: VideoValidationResult;
  cover?: ImageValidationResult;
  shareToFeed: boolean;
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

function parseContentLength(header: string | null): number | undefined {
  if (!header) return undefined;
  const n = Number.parseInt(header, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function isAllowedVideoContentType(contentType: string): boolean {
  const base = contentType.split(";")[0].trim().toLowerCase();
  return (REELS_VIDEO_CONTENT_TYPES as readonly string[]).includes(base);
}

async function probeVideoUrl(url: string): Promise<{
  res: Response;
  contentType: string;
  contentLength?: number;
}> {
  let res: Response;
  try {
    res = await fetch(url, { method: "HEAD", redirect: "follow", cache: "no-store" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Could not fetch video: ${msg}.`);
  }

  if (res.status === 405 || res.status === 501) {
    res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: { Range: "bytes=0-0" },
    });
  }

  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const contentLength = parseContentLength(res.headers.get("content-length"));
  return { res, contentType, contentLength };
}

export async function validateVideoUrl(url: string): Promise<VideoValidationResult> {
  const errors: string[] = [];

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { url, ok: false, errors: ["Invalid URL."] };
  }

  if (parsed.protocol !== "https:") {
    errors.push("Video URL must use HTTPS.");
  }

  let probe: Awaited<ReturnType<typeof probeVideoUrl>>;
  try {
    probe = await probeVideoUrl(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { url, ok: false, errors: [msg] };
  }

  const { res, contentType, contentLength } = probe;
  if (!res.ok && res.status !== 206) {
    errors.push(`Video URL returned HTTP ${res.status}.`);
    return { url, ok: false, errors, contentType, contentLength };
  }

  if (!isAllowedVideoContentType(contentType)) {
    errors.push(
      `Content-Type must be video/mp4 or video/quicktime (got ${contentType || "unknown"}).`,
    );
  }

  if (contentLength != null && contentLength > REELS_VIDEO_MAX_BYTES) {
    errors.push(
      `Video exceeds ${REELS_VIDEO_MAX_BYTES / (1024 * 1024)}MB (Content-Length ${contentLength}).`,
    );
  }

  return {
    url,
    ok: errors.length === 0,
    errors,
    contentType,
    contentLength,
  };
}

export async function validateReelsPayload(input: {
  videoUrl: string;
  caption: string;
  coverUrl?: string;
  shareToFeed?: boolean;
}): Promise<ReelsValidationResult> {
  const errors: string[] = [];
  const captionResult = validateCaption(input.caption);
  const shareToFeed = input.shareToFeed !== false;

  if (!captionResult.ok) {
    errors.push(...captionResult.errors);
  }

  const videoUrl = String(input.videoUrl ?? "").trim();
  if (!videoUrl) {
    errors.push("videoUrl is required for REELS.");
    return {
      ok: false,
      mediaType: "REELS",
      caption: captionResult,
      video: { url: videoUrl, ok: false, errors: ["videoUrl is required."] },
      shareToFeed,
      errors,
    };
  }

  const video = await validateVideoUrl(videoUrl);
  if (!video.ok) {
    errors.push(...video.errors.map((e) => `${video.url}: ${e}`));
  }

  let cover: ImageValidationResult | undefined;
  const coverUrl = input.coverUrl?.trim();
  if (coverUrl) {
    cover = await validateImageUrl(coverUrl);
    if (!cover.ok) {
      errors.push(...cover.errors.map((e) => `${cover!.url}: ${e}`));
    }
  }

  return {
    ok: errors.length === 0,
    mediaType: "REELS",
    caption: captionResult,
    video,
    cover,
    shareToFeed,
    errors,
  };
}
