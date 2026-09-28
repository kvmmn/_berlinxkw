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
