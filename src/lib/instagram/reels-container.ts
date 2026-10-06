import { IG_GRAPH_FETCH_TIMEOUT_MS } from "./constants";
import { igFetch } from "./graph-fetch";

export const REELS_PUBLISHED_MEDIA_ID_NOTE =
  "Container status is PUBLISHED on Instagram. Graph does not return a separate media id on the container; mediaId is omitted.";

type ContainerStatusResponse = {
  status_code?: string;
  status?: string;
};

/** Status poll using only fields supported on IG media containers. */
export async function fetchReelsContainerStatusCode(
  containerId: string,
  accessToken: string,
): Promise<string | undefined> {
  const res = await igFetch<ContainerStatusResponse>(containerId, accessToken, {
    searchParams: { fields: "status_code" },
    timeoutMs: IG_GRAPH_FETCH_TIMEOUT_MS,
  });
  return res.status_code ?? res.status;
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
