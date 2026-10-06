import "server-only";

import {
  CONTAINER_POLL_INTERVAL_MS,
  CONTAINER_POLL_MAX_ATTEMPTS,
  IG_GRAPH_BASE,
  REELS_CONTAINER_POLL_INTERVAL_MS,
  REELS_CONTAINER_POLL_MAX_ATTEMPTS,
} from "./constants";
import type { InstagramTokenRecord } from "./token-store";

type GraphError = { message?: string; type?: string; code?: number };

async function igFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit & { searchParams?: Record<string, string> },
): Promise<T> {
  const url = path.startsWith("http") ? new URL(path) : new URL(`${IG_GRAPH_BASE}/${path.replace(/^\//, "")}`);
  if (init?.searchParams) {
    for (const [k, v] of Object.entries(init.searchParams)) {
      url.searchParams.set(k, v);
    }
  }
  url.searchParams.set("access_token", accessToken);

  const rest: RequestInit = { ...(init ?? {}) };
  delete (rest as { searchParams?: unknown }).searchParams;
  const res = await fetch(url.toString(), { ...rest, cache: "no-store" });
  const body = (await res.json()) as T & { error?: GraphError };
  if (!res.ok || body.error) {
    throw new Error(body.error?.message ?? `Instagram Graph API ${res.status}`);
  }
  return body;
}

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

async function waitForContainerReady(
  containerId: string,
  accessToken: string,
  opts?: { intervalMs?: number; maxAttempts?: number },
): Promise<void> {
  const intervalMs = opts?.intervalMs ?? CONTAINER_POLL_INTERVAL_MS;
  const maxAttempts = opts?.maxAttempts ?? CONTAINER_POLL_MAX_ATTEMPTS;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await igFetch<ContainerStatus>(containerId, accessToken, {
      searchParams: { fields: "status_code,status" },
    });
    const code = status.status_code ?? status.status;
    if (code === "FINISHED") return;
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
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Timed out waiting for Instagram media container.");
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
): Promise<PublishToInstagramResult> {
  const creationId = await createReelsContainer(igUserId, accessToken, input);
  await waitForContainerReady(creationId, accessToken, {
    intervalMs: REELS_CONTAINER_POLL_INTERVAL_MS,
    maxAttempts: REELS_CONTAINER_POLL_MAX_ATTEMPTS,
  });
  const mediaId = await publishContainer(igUserId, accessToken, creationId);
  const permalink = await fetchPermalink(mediaId, accessToken);
  return { mediaId, permalink, igUserId };
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
