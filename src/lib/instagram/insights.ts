import { igFetch } from "./graph-fetch";

/** Instagram Graph read timeout for insights routes (≤10s). */
export const INSIGHTS_GRAPH_TIMEOUT_MS = 10_000;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MEDIA_ID_RE = /^\d+$/;

const ACCOUNT_DAILY_METRICS = [
  "reach",
  "profile_views",
  "website_clicks",
  "profile_links_taps",
  "follower_count",
] as const;

const MEDIA_CORE_METRICS = [
  "reach",
  "views",
  "saved",
  "shares",
  "total_interactions",
] as const;

const MEDIA_OPTIONAL_METRICS = ["profile_visits", "follows"] as const;

export type InsightNote = { metric: string; note: string };

type GraphInsightValue = { value?: number; end_time?: string };
type GraphInsight = {
  name: string;
  values?: GraphInsightValue[];
  total_value?: { value?: number };
};

export type InsightsQuery =
  | { mode: "media"; ids: string[]; includeComments: boolean }
  | { mode: "recent"; n: number }
  | { mode: "account"; since: string; until: string };

export type MediaInsightsItem = {
  id: string;
  media_type?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
  insights: Record<string, number>;
  insightNotes: InsightNote[];
  comments?: MediaComment[];
  commentsTruncated?: boolean;
};

export type MediaComment = {
  text?: string;
  timestamp?: string;
  username?: string;
  like_count?: number;
};

export type RecentMediaItem = {
  id: string;
  permalink?: string;
  timestamp?: string;
};

export type AccountDailyRow = {
  date: string;
  reach?: number;
  profile_views?: number;
  website_clicks?: number;
  profile_links_taps?: number;
  follower_count?: number;
};

function parseIsoDate(s: string): Date | null {
  if (!DATE_RE.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  if (d.toISOString().slice(0, 10) !== s) return null;
  return d;
}

function daySpanInclusive(since: string, until: string): number {
  const a = parseIsoDate(since)!.getTime();
  const b = parseIsoDate(until)!.getTime();
  return Math.floor((b - a) / (24 * 60 * 60 * 1000)) + 1;
}

export function parseMediaIdsParam(raw: string | null): string[] | { error: string } {
  if (raw == null || raw.trim() === "") return { error: "Missing media parameter" };
  const parts = raw.split(",");
  if (parts.length === 0 || parts.length > 10) {
    return { error: "media must contain 1–10 comma-separated numeric ids" };
  }
  const ids: string[] = [];
  for (const part of parts) {
    const id = part.trim();
    if (!MEDIA_ID_RE.test(id)) {
      return { error: "media ids must be digits only" };
    }
    ids.push(id);
  }
  return ids;
}

export function parseRecentParam(raw: string | null): number | { error: string } {
  if (raw == null || raw.trim() === "") return { error: "Missing recent parameter" };
  if (!/^\d+$/.test(raw.trim())) return { error: "recent must be a positive integer" };
  const n = Number.parseInt(raw.trim(), 10);
  if (n < 1 || n > 25) return { error: "recent must be between 1 and 25" };
  return n;
}

export function parseAccountDateRange(
  sinceRaw: string | null,
  untilRaw: string | null,
): { since: string; until: string } | { error: string } {
  if (sinceRaw == null || untilRaw == null || sinceRaw.trim() === "" || untilRaw.trim() === "") {
    return { error: "account queries require since and until (YYYY-MM-DD)" };
  }
  const since = sinceRaw.trim();
  const until = untilRaw.trim();
  if (!DATE_RE.test(since) || !DATE_RE.test(until)) {
    return { error: "since and until must be YYYY-MM-DD" };
  }
  const sinceDate = parseIsoDate(since);
  const untilDate = parseIsoDate(until);
  if (!sinceDate || !untilDate) {
    return { error: "since and until must be valid calendar dates" };
  }
  if (untilDate.getTime() < sinceDate.getTime()) {
    return { error: "until must be on or after since" };
  }
  const span = daySpanInclusive(since, until);
  if (span > 30) {
    return { error: "Date range must span at most 30 days" };
  }
  return { since, until };
}

export function parseInsightsQuery(searchParams: URLSearchParams): InsightsQuery | { error: string } {
  const hasMedia = searchParams.has("media");
  const hasRecent = searchParams.has("recent");
  const hasAccount = searchParams.has("account");

  const modeCount = [hasMedia, hasRecent, hasAccount].filter(Boolean).length;
  if (modeCount === 0) {
    return { error: "Provide media, recent, or account=1 with since/until" };
  }
  if (modeCount > 1) {
    return { error: "Use only one of media, recent, or account query parameters" };
  }

  if (hasAccount) {
    if (searchParams.get("account") !== "1") {
      return { error: "account must be 1" };
    }
    const range = parseAccountDateRange(
      searchParams.get("since"),
      searchParams.get("until"),
    );
    if ("error" in range) return range;
    return { mode: "account", since: range.since, until: range.until };
  }

  if (hasRecent) {
    const n = parseRecentParam(searchParams.get("recent"));
    if (typeof n !== "number") return n;
    return { mode: "recent", n };
  }

  const ids = parseMediaIdsParam(searchParams.get("media"));
  if (!Array.isArray(ids)) return ids;
  const includeComments = searchParams.get("comments") === "1";
  return { mode: "media", ids, includeComments };
}

function insightValuesByDate(insight: GraphInsight | undefined): Map<string, number> {
  const map = new Map<string, number>();
  if (!insight?.values?.length) return map;
  for (const v of insight.values) {
    const date = (v.end_time ?? "").slice(0, 10);
    if (!date) continue;
    map.set(date, v.value ?? 0);
  }
  return map;
}

function sanitizeGraphErrorMessage(msg: string): string {
  return msg.replace(/access_token=[^&\s]+/gi, "access_token=[redacted]");
}

async function fetchSingleAccountMetric(
  igUserId: string,
  accessToken: string,
  metric: string,
  since: string,
  until: string,
): Promise<{ byDate: Map<string, number> } | { note: string }> {
  try {
    const res = await igFetch<{ data?: GraphInsight[] }>(`${igUserId}/insights`, accessToken, {
      method: "GET",
      searchParams: {
        metric,
        period: "day",
        since,
        until,
      },
      timeoutMs: INSIGHTS_GRAPH_TIMEOUT_MS,
    });
    const row = (res.data ?? []).find((d) => d.name === metric) ?? res.data?.[0];
    return { byDate: insightValuesByDate(row) };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    return { note: sanitizeGraphErrorMessage(raw) };
  }
}

export async function fetchAccountDailyInsights(
  igUserId: string,
  accessToken: string,
  since: string,
  until: string,
): Promise<{ daily: AccountDailyRow[]; insightNotes: InsightNote[] }> {
  const notes: InsightNote[] = [];
  const merged = new Map<string, AccountDailyRow>();

  for (const metric of ACCOUNT_DAILY_METRICS) {
    const result = await fetchSingleAccountMetric(igUserId, accessToken, metric, since, until);
    if ("note" in result) {
      notes.push({ metric, note: result.note });
      continue;
    }
    for (const [date, value] of result.byDate) {
      let row = merged.get(date);
      if (!row) {
        row = { date };
        merged.set(date, row);
      }
      (row as Record<string, string | number | undefined>)[metric] = value;
    }
  }

  const daily = [...merged.values()].sort((a, b) => a.date.localeCompare(b.date));
  return { daily, insightNotes: notes };
}

async function fetchSingleMediaMetric(
  mediaId: string,
  accessToken: string,
  metric: string,
): Promise<number | { note: string }> {
  try {
    const res = await igFetch<{ data?: GraphInsight[] }>(`${mediaId}/insights`, accessToken, {
      method: "GET",
      searchParams: { metric },
      timeoutMs: INSIGHTS_GRAPH_TIMEOUT_MS,
    });
    const row = (res.data ?? []).find((d) => d.name === metric) ?? res.data?.[0];
    if (!row) return { note: "Metric not returned" };
    if (row.total_value?.value != null) return row.total_value.value;
    const values = row.values ?? [];
    if (values.length === 0) return { note: "Metric has no values" };
    return values.reduce((acc, v) => acc + (v.value ?? 0), 0);
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    return { note: sanitizeGraphErrorMessage(raw) };
  }
}

async function fetchMediaInsightsBlock(
  mediaId: string,
  accessToken: string,
): Promise<{ insights: Record<string, number>; insightNotes: InsightNote[] }> {
  const insights: Record<string, number> = {};
  const insightNotes: InsightNote[] = [];
  const metrics = [...MEDIA_CORE_METRICS, ...MEDIA_OPTIONAL_METRICS];

  for (const metric of metrics) {
    const result = await fetchSingleMediaMetric(mediaId, accessToken, metric);
    if (typeof result === "number") {
      insights[metric] = result;
    } else {
      insightNotes.push({ metric, note: result.note });
    }
  }

  return { insights, insightNotes };
}

type MediaFields = {
  id: string;
  media_type?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
};

async function fetchMediaFields(mediaId: string, accessToken: string): Promise<MediaFields> {
  return igFetch<MediaFields>(mediaId, accessToken, {
    method: "GET",
    searchParams: {
      fields: "id,media_type,permalink,timestamp,like_count,comments_count",
    },
    timeoutMs: INSIGHTS_GRAPH_TIMEOUT_MS,
  });
}

type CommentsPage = {
  data?: Array<{
    text?: string;
    timestamp?: string;
    username?: string;
    like_count?: number;
  }>;
  paging?: { cursors?: { after?: string }; next?: string };
};

async function fetchMediaComments(
  mediaId: string,
  accessToken: string,
  maxItems: number,
): Promise<{ comments: MediaComment[]; truncated: boolean }> {
  const comments: MediaComment[] = [];
  let after: string | undefined;
  let truncated = false;

  while (comments.length < maxItems) {
    const searchParams: Record<string, string> = {
      fields: "text,timestamp,username,like_count",
      limit: String(Math.min(50, maxItems - comments.length)),
    };
    if (after) searchParams.after = after;

    const page = await igFetch<CommentsPage>(`${mediaId}/comments`, accessToken, {
      method: "GET",
      searchParams,
      timeoutMs: INSIGHTS_GRAPH_TIMEOUT_MS,
    });

    for (const c of page.data ?? []) {
      if (comments.length >= maxItems) break;
      comments.push({
        text: c.text,
        timestamp: c.timestamp,
        username: c.username,
        like_count: c.like_count,
      });
    }

    after = page.paging?.cursors?.after;
    if (!after || !page.paging?.next) break;
    if (comments.length >= maxItems) {
      truncated = Boolean(page.paging?.next);
      break;
    }
  }

  return { comments, truncated };
}

export async function fetchMediaInsightsList(
  ids: string[],
  accessToken: string,
  includeComments: boolean,
): Promise<MediaInsightsItem[]> {
  const items: MediaInsightsItem[] = [];

  for (const id of ids) {
    const fields = await fetchMediaFields(id, accessToken);
    const { insights, insightNotes } = await fetchMediaInsightsBlock(id, accessToken);
    const item: MediaInsightsItem = {
      id: fields.id ?? id,
      media_type: fields.media_type,
      permalink: fields.permalink,
      timestamp: fields.timestamp,
      like_count: fields.like_count,
      comments_count: fields.comments_count,
      insights,
      insightNotes,
    };

    if (includeComments) {
      const { comments, truncated } = await fetchMediaComments(id, accessToken, 200);
      item.comments = comments;
      if (truncated) item.commentsTruncated = true;
    }

    items.push(item);
  }

  return items;
}

type MediaListPage = {
  data?: Array<{ id: string; permalink?: string; timestamp?: string }>;
};

export async function fetchRecentMediaList(
  igUserId: string,
  accessToken: string,
  n: number,
): Promise<RecentMediaItem[]> {
  const res = await igFetch<MediaListPage>(`${igUserId}/media`, accessToken, {
    method: "GET",
    searchParams: {
      fields: "id,permalink,timestamp",
      limit: String(n),
    },
    timeoutMs: INSIGHTS_GRAPH_TIMEOUT_MS,
  });
  return (res.data ?? []).map((row) => ({
    id: row.id,
    permalink: row.permalink,
    timestamp: row.timestamp,
  }));
}

export async function executeInsightsQuery(
  query: InsightsQuery,
  creds: { accessToken: string; igUserId: string },
): Promise<{
  ok: true;
  media?: MediaInsightsItem[];
  recent?: RecentMediaItem[];
  account?: {
    since: string;
    until: string;
    daily: AccountDailyRow[];
    insightNotes: InsightNote[];
  };
}> {
  if (query.mode === "media") {
    const media = await fetchMediaInsightsList(query.ids, creds.accessToken, query.includeComments);
    return { ok: true, media };
  }
  if (query.mode === "recent") {
    const recent = await fetchRecentMediaList(creds.igUserId, creds.accessToken, query.n);
    return { ok: true, recent };
  }
  const { daily, insightNotes } = await fetchAccountDailyInsights(
    creds.igUserId,
    creds.accessToken,
    query.since,
    query.until,
  );
  return {
    ok: true,
    account: { since: query.since, until: query.until, daily, insightNotes },
  };
}
