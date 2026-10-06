import "server-only";

import {
  CONTAINER_POLL_INTERVAL_MS,
  CONTAINER_POLL_MAX_ATTEMPTS,
  IG_GRAPH_FETCH_TIMEOUT_MS,
  REELS_CONTAINER_POLL_DEADLINE_MS,
  REELS_CONTAINER_POLL_INTERVAL_MS,
} from "./constants";
import { igFetch, isFetchTimeoutError } from "./graph-fetch";
import {
  fetchReelsContainerStatusCode,
  isReelsContainerPublished,
  REELS_PUBLISHED_MEDIA_ID_NOTE,
} from "./reels-container";
import { ReelsStillProcessingError } from "./reels-processing";
import type { InstagramTokenRecord } from "./token-store";

type GraphError = { message?: string; type?: string; code?: number };

export type IgProfile = {
  id: string;
  username?: string;
  user_id?: string;
};

export async function fetchIgProfile(accessToken: string): Promise<{ igUserId: string; username?: string }> {
  const me = await igFetch<IgProfile>("me", accessToken, {
    searchParams: { fields: "user_id,username,id" },
  });
  const igUserId = me.user_id ?? me.id;
  if (!igUserId) throw new Error("Instagram /me did not return a user id.");
  return { igUserId, username: me.username };
}

async function createImageContainer(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  opts?: { isCarouselItem?: boolean },
): Promise<string> {
  const params = new URLSearchParams();
  params.set("image_url", imageUrl);
  if (opts?.isCarouselItem) params.set("is_carousel_item", "true");

  const res = await igFetch<{ id: string }>(`${igUserId}/media`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.id) throw new Error("Missing container id from Instagram.");
  return res.id;
}

async function createCarouselContainer(
  igUserId: string,
  accessToken: string,
  childIds: string[],
  caption: string,
): Promise<string> {
  const params = new URLSearchParams();
  params.set("media_type", "CAROUSEL");
  params.set("children", childIds.join(","));
  params.set("caption", caption);

  const res = await igFetch<{ id: string }>(`${igUserId}/media`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.id) throw new Error("Missing carousel container id.");
  return res.id;
}

type ContainerStatus = {
  status_code?: string;
  status?: string;
};

type ContainerReadyState = "finished" | "published";

async function waitForContainerReady(
  containerId: string,
  accessToken: string,
  opts?: { intervalMs?: number; maxAttempts?: number },
): Promise<ContainerReadyState> {
  const intervalMs = opts?.intervalMs ?? CONTAINER_POLL_INTERVAL_MS;
  const maxAttempts = opts?.maxAttempts ?? CONTAINER_POLL_MAX_ATTEMPTS;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await igFetch<ContainerStatus>(containerId, accessToken, {
      searchParams: { fields: "status_code,status" },
    });
    const code = status.status_code ?? status.status;
    if (code === "PUBLISHED") return "published";
    if (code === "FINISHED") return "finished";
    if (code === "ERROR") {
      const detail = status.status ?? status.status_code;
      throw new Error(
        detail && detail !== "ERROR"
          ? `Instagram media container processing failed: ${detail}`
          : "Instagram media container processing failed.",
      );
    }
    if (code === "EXPIRED") {
      throw new Error("Instagram media container expired before publish.");
    }
    if (attempt + 1 < maxAttempts) {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
  throw new Error("Timed out waiting for Instagram media container.");
}

async function waitForReelsContainerReady(
  containerId: string,
  accessToken: string,
  startedAtMs: number,
): Promise<ContainerReadyState> {
  const intervalMs = REELS_CONTAINER_POLL_INTERVAL_MS;
  const deadlineAt = startedAtMs + REELS_CONTAINER_POLL_DEADLINE_MS;

  while (Date.now() < deadlineAt) {
    let code: string | undefined;
    try {
      code = await fetchReelsContainerStatusCode(containerId, accessToken);
    } catch (err) {
      if (isFetchTimeoutError(err) && Date.now() < deadlineAt) {
        const remaining = deadlineAt - Date.now();
        if (remaining <= 0) break;
        await new Promise((r) => setTimeout(r, Math.min(intervalMs, remaining)));
        continue;
      }
      throw err;
    }

    if (code === "PUBLISHED") return "published";
    if (code === "FINISHED") return "finished";
    if (code === "ERROR") {
      throw new Error("Instagram media container processing failed.");
    }
    if (code === "EXPIRED") {
      throw new Error("Instagram media container expired before publish.");
    }

    const remaining = deadlineAt - Date.now();
    if (remaining <= 0) break;
    await new Promise((r) => setTimeout(r, Math.min(intervalMs, remaining)));
  }

  throw new ReelsStillProcessingError(containerId);
}

async function createReelsContainer(
  igUserId: string,
  accessToken: string,
  input: { videoUrl: string; caption: string; coverUrl?: string; shareToFeed: boolean },
): Promise<string> {
  const params = new URLSearchParams();
  params.set("media_type", "REELS");
  params.set("video_url", input.videoUrl);
  params.set("caption", input.caption);
  params.set("share_to_feed", input.shareToFeed ? "true" : "false");
  if (input.coverUrl) params.set("cover_url", input.coverUrl);

  const res = await igFetch<{ id: string }>(`${igUserId}/media`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    timeoutMs: IG_GRAPH_FETCH_TIMEOUT_MS,
  });
  if (!res.id) throw new Error("Missing Reels container id from Instagram.");
  return res.id;
}

async function publishContainer(
  igUserId: string,
  accessToken: string,
  creationId: string,
): Promise<string> {
  const params = new URLSearchParams();
  params.set("creation_id", creationId);

  const res = await igFetch<{ id: string }>(`${igUserId}/media_publish`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.id) throw new Error("Missing media id after publish.");
  return res.id;
}

async function publishReelsContainer(
  igUserId: string,
  accessToken: string,
  creationId: string,
): Promise<string | null> {
  const params = new URLSearchParams();
  params.set("creation_id", creationId);

  try {
    const res = await igFetch<{ id: string }>(`${igUserId}/media_publish`, accessToken, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      timeoutMs: IG_GRAPH_FETCH_TIMEOUT_MS,
    });
    if (!res.id) throw new Error("Missing media id after publish.");
    return res.id;
  } catch (err) {
    if (await isReelsContainerPublished(creationId, accessToken)) {
      return null;
    }
    throw err;
  }
}

async function fetchReelsPermalink(
  mediaId: string,
  accessToken: string,
  timeoutMs: number,
): Promise<string | undefined> {
  if (timeoutMs <= 0) return undefined;
  try {
    const res = await igFetch<{ permalink?: string }>(mediaId, accessToken, {
      searchParams: { fields: "permalink" },
      timeoutMs,
    });
    return res.permalink;
  } catch {
    return undefined;
  }
}

function reelsPermalinkTimeoutMs(startedAtMs: number): number {
  const deadlineAt = startedAtMs + REELS_CONTAINER_POLL_DEADLINE_MS;
  const remaining = deadlineAt - Date.now();
  if (remaining <= 0) return 0;
  return Math.min(IG_GRAPH_FETCH_TIMEOUT_MS, remaining);
}

async function fetchPermalink(mediaId: string, accessToken: string): Promise<string | undefined> {
  try {
    const res = await igFetch<{ permalink?: string }>(mediaId, accessToken, {
      searchParams: { fields: "permalink" },
    });
    return res.permalink;
  } catch {
    return undefined;
  }
}

export type PublishToInstagramResult = {
  mediaId: string;
  permalink?: string;
  igUserId: string;
};

export type PublishReelsToInstagramResult = {
  igUserId: string;
  containerId: string;
  published: true;
  mediaId: string | null;
  mediaIdNote?: string;
  permalink?: string;
};

export async function publishToInstagram(
  accessToken: string,
  igUserId: string,
  imageUrls: string[],
  caption: string,
): Promise<PublishToInstagramResult> {
  let creationId: string;

  if (imageUrls.length === 1) {
    const singleParams = new URLSearchParams({ image_url: imageUrls[0]!, caption });
    const single = await igFetch<{ id: string }>(`${igUserId}/media`, accessToken, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: singleParams.toString(),
    });
    creationId = single.id;
  } else {
    const childIds: string[] = [];
    for (const url of imageUrls) {
      childIds.push(await createImageContainer(igUserId, accessToken, url, { isCarouselItem: true }));
    }
    for (const childId of childIds) {
      await waitForContainerReady(childId, accessToken);
    }
    creationId = await createCarouselContainer(igUserId, accessToken, childIds, caption);
  }

  await waitForContainerReady(creationId, accessToken);
  const mediaId = await publishContainer(igUserId, accessToken, creationId);
  const permalink = await fetchPermalink(mediaId, accessToken);

  return { mediaId, permalink, igUserId };
}

export async function publishReelsToInstagram(
  accessToken: string,
  igUserId: string,
  input: { videoUrl: string; caption: string; coverUrl?: string; shareToFeed: boolean },
  opts?: { startedAtMs?: number },
): Promise<PublishReelsToInstagramResult> {
  const startedAtMs = opts?.startedAtMs ?? Date.now();
  const creationId = await createReelsContainer(igUserId, accessToken, input);
  const ready = await waitForReelsContainerReady(creationId, accessToken, startedAtMs);

  if (ready === "published") {
    return {
      igUserId,
      containerId: creationId,
      published: true,
      mediaId: null,
      mediaIdNote: REELS_PUBLISHED_MEDIA_ID_NOTE,
    };
  }

  const mediaId = await publishReelsContainer(igUserId, accessToken, creationId);
  if (mediaId === null) {
    return {
      igUserId,
      containerId: creationId,
      published: true,
      mediaId: null,
      mediaIdNote: REELS_PUBLISHED_MEDIA_ID_NOTE,
    };
  }

  const permalink = await fetchReelsPermalink(
    mediaId,
    accessToken,
    reelsPermalinkTimeoutMs(startedAtMs),
  );

  return {
    igUserId,
    containerId: creationId,
    published: true,
    mediaId,
    permalink,
  };
}

export type RefreshTokenResult = {
  accessToken: string;
  expiresIn: number;
  expiresAt: string;
};

export async function refreshInstagramAccessToken(accessToken: string): Promise<RefreshTokenResult> {
  const url = new URL("https://graph.instagram.com/refresh_access_token");
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const body = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: GraphError;
  };

  if (!res.ok || body.error || !body.access_token) {
    throw new Error(body.error?.message ?? `Token refresh failed (${res.status})`);
  }

  const expiresIn = body.expires_in ?? 60 * 24 * 60 * 60;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    accessToken: body.access_token,
    expiresIn,
    expiresAt,
  };
}

export async function resolveIgCredentials(
  record: InstagramTokenRecord,
): Promise<{ accessToken: string; igUserId: string; username?: string }> {
  const accessToken = record.accessToken;
  if (record.igUserId) {
    return { accessToken, igUserId: record.igUserId, username: record.username };
  }
  const profile = await fetchIgProfile(accessToken);
  return { accessToken, igUserId: profile.igUserId, username: profile.username };
}
