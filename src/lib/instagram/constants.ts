/** Instagram API with Instagram Login (graph.instagram.com). */
export const IG_GRAPH_VERSION = "v21.0";

export const IG_GRAPH_BASE = `https://graph.instagram.com/${IG_GRAPH_VERSION}`;

export const IG_BLOB_PREFIX = "berlinxkw/instagram/";

/** Bundled demo JPEG served when Blob object is missing (preview dryRun). */
export const IG_DEMO_BLOB_PATH = `${IG_BLOB_PREFIX}demo/publish-sample.jpg`;

export const CAPTION_MAX_LENGTH = 2200;
export const HASHTAG_MAX_COUNT = 30;
export const CAROUSEL_MIN_ITEMS = 2;
export const CAROUSEL_MAX_ITEMS = 10;

/** Instagram feed aspect ratio limits (width / height). */
export const ASPECT_RATIO_MIN = 0.8; // 4:5 portrait
export const ASPECT_RATIO_MAX = 1.91; // landscape

export const CONTAINER_POLL_INTERVAL_MS = 2000;
export const CONTAINER_POLL_MAX_ATTEMPTS = 30;

/** Reels container processing can take several minutes. */
export const REELS_CONTAINER_POLL_INTERVAL_MS = 2000;
export const REELS_CONTAINER_POLL_MAX_ATTEMPTS = 150;

/** Instagram Reels remote video URL limit (dryRun validation). */
export const REELS_VIDEO_MAX_BYTES = 300 * 1024 * 1024;

/** Portal upload limit for MP4 (direct or client upload token). */
export const IG_UPLOAD_VIDEO_MAX_BYTES = 100 * 1024 * 1024;

/** Stay under Vercel serverless request body limit (~4.5 MB) for direct POST upload. */
export const IG_DIRECT_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

export const REELS_VIDEO_CONTENT_TYPES = ["video/mp4", "video/quicktime"] as const;

/** Bundled demo MP4 for preview dryRun / Range checks when Blob object is missing. */
export const IG_DEMO_REEL_PATH = `${IG_BLOB_PREFIX}demo/publish-sample.mp4`;
