import {
  IG_GRAPH_FETCH_TIMEOUT_MS,
  REELS_PUBLISH_CHECKBACK_DEADLINE_MS,
} from "./constants";
import { igFetch } from "./graph-fetch";

export const REELS_PUBLISHED_MEDIA_ID_NOTE =
  "Container status is PUBLISHED on Instagram. Graph does not return a separate media id on the container; mediaId is omitted.";

/** Backoff between publish-timeout status polls (extends past ~4.5s to catch late PUBLISHED flips). */
export const PUBLISH_RECONCILE_BACKOFF_MS = [
  500, 1500, 2500, 4000, 5000, 7000, 8000,
] as const;

export function reelsPublishCheckbackDeadlineAt(startedAtMs: number): number {
  return startedAtMs + REELS_PUBLISH_CHECKBACK_DEADLINE_MS;
}

export function publishReconcileBackoffMs(attempt: number): number {
  const idx = Math.min(attempt, PUBLISH_RECONCILE_BACKOFF_MS.length - 1);
  return PUBLISH_RECONCILE_BACKOFF_MS[idx]!;
}

export type ReelsContainerStatus = {
  status_code?: string;
  status?: string;
};

export function reelsContainerStatusCode(status: ReelsContainerStatus): string | undefined {
  return status.status_code ?? status.status;
}

/** Status poll using documented IG container fields only. */
export async function fetchReelsContainerStatus(
  containerId: string,
  accessToken: string,
): Promise<ReelsContainerStatus> {
  return igFetch<ReelsContainerStatus>(containerId, accessToken, {
    searchParams: { fields: "status_code,status" },
    timeoutMs: IG_GRAPH_FETCH_TIMEOUT_MS,
  });
}

/** @deprecated alias for callers that only need the code string */
export async function fetchReelsContainerStatusCode(
  containerId: string,
  accessToken: string,
): Promise<string | undefined> {
  const status = await fetchReelsContainerStatus(containerId, accessToken);
  return reelsContainerStatusCode(status);
}

export async function isReelsContainerPublished(
  containerId: string,
  accessToken: string,
): Promise<boolean> {
  try {
    const code = await fetchReelsContainerStatusCode(containerId, accessToken);
    return code === "PUBLISHED";
  } catch {
    return false;
  }
}

/**
 * After an ambiguous publish failure (e.g. timeout), re-check PUBLISHED status
 * a few times within the remaining Reels deadline before treating as failed.
 */
export async function waitForReelsContainerPublishedAfterFailure(
  containerId: string,
  accessToken: string,
  startedAtMs: number,
): Promise<boolean> {
  const deadlineAt = reelsPublishCheckbackDeadlineAt(startedAtMs);
  let attempt = 0;

  while (true) {
    if (Date.now() >= deadlineAt) return false;
    if (await isReelsContainerPublished(containerId, accessToken)) {
      return true;
    }

    const remaining = deadlineAt - Date.now();
    if (remaining <= 0) return false;

    const backoff = publishReconcileBackoffMs(attempt);
    attempt += 1;
    await new Promise((r) => setTimeout(r, Math.min(backoff, remaining)));
  }
}
