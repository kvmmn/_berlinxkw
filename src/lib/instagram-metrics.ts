import "server-only";

import type { DailySnapshot, WeekMetrics } from "./types";

const GRAPH_VERSION = "v21.0";

export function isInstagramSyncConfigured(): boolean {
  return Boolean(
    process.env.INSTAGRAM_ACCESS_TOKEN?.trim() &&
      process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim(),
  );
}

export function instagramSyncHint(): { en: string; fa: string } {
  if (isInstagramSyncConfigured()) {
    return {
      en: "Meta tokens configured — sync is available.",
      fa: "توکن‌های متا تنظیم شده — همگام‌سازی فعال است.",
    };
  }
  return {
    en: "Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in Vercel env to enable sync (free Meta Graph API).",
    fa: "برای همگام‌سازی رایگان، INSTAGRAM_ACCESS_TOKEN و INSTAGRAM_BUSINESS_ACCOUNT_ID را در env تنظیم کنید.",
  };
}

type GraphInsightValue = { value?: number; end_time?: string };
type GraphInsight = { name: string; values?: GraphInsightValue[]; total_value?: { value?: number } };

async function graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN!.trim();
  const base = path.startsWith("http")
    ? path
    : `https://graph.facebook.com/${GRAPH_VERSION}/${path.replace(/^\//, "")}`;
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const body = (await res.json()) as T & { error?: { message: string; code?: number } };
  if (!res.ok || body.error) {
    throw new Error(body.error?.message ?? `Graph API ${res.status}`);
  }
  return body;
}

function sumInsightValues(insight: GraphInsight | undefined): number {
  if (!insight) return 0;
  if (insight.total_value?.value != null) return insight.total_value.value;
  return (insight.values ?? []).reduce((acc, v) => acc + (v.value ?? 0), 0);
}

function latestInsightValues(insight: GraphInsight | undefined, maxDays = 7): DailySnapshot[] {
  if (!insight?.values?.length) return [];
  const sorted = [...insight.values].sort(
    (a, b) => new Date(a.end_time ?? 0).getTime() - new Date(b.end_time ?? 0).getTime(),
  );
  return sorted.slice(-maxDays).map((v) => ({
    date: (v.end_time ?? new Date().toISOString()).slice(0, 10),
    followers: 0,
    reach: v.value ?? 0,
    engagementRate: 0,
  }));
}

export type InstagramSyncResult = {
  metrics: WeekMetrics;
  dailySnapshots: DailySnapshot[];
  fieldsUpdated: string[];
  insightsAvailable: boolean;
  warnings: string[];
};

/**
 * Pull @berlinxkw metrics from Meta Graph API (free for your own Professional account).
 * Does not store credentials — reads env at call time only.
 */
export async function fetchInstagramMetricsForWeek(): Promise<InstagramSyncResult> {
  if (!isInstagramSyncConfigured()) {
    throw new Error("Instagram sync env vars are not configured");
  }

  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!.trim();
  const warnings: string[] = [];
  const fieldsUpdated: string[] = [];

  const profile = await graphGet<{
    followers_count?: number;
    media_count?: number;
  }>(igUserId, {
    fields: "followers_count,media_count",
  });

  const metrics: WeekMetrics = {
    followers: profile.followers_count ?? 0,
    reach: 0,
    posts: profile.media_count ?? 0,
    engagementRate: 0,
    saves: 0,
    profileVisits: 0,
  };
  if (profile.followers_count != null) fieldsUpdated.push("followers");
  if (profile.media_count != null) fieldsUpdated.push("posts");

  let insightsAvailable = true;
  let dailySnapshots: DailySnapshot[] = [];

  try {
    const insightsRes = await graphGet<{ data?: GraphInsight[] }>(`${igUserId}/insights`, {
      metric: "reach,profile_views,saved,accounts_engaged",
      period: "day",
      metric_type: "total_value",
    });

    const byName = new Map((insightsRes.data ?? []).map((i) => [i.name, i]));
    const reachInsight = byName.get("reach");
    const profileViews = byName.get("profile_views");
    const saved = byName.get("saved");
    const engaged = byName.get("accounts_engaged");

    metrics.reach = sumInsightValues(reachInsight);
    metrics.profileVisits = sumInsightValues(profileViews);
    metrics.saves = sumInsightValues(saved);

    if (metrics.reach > 0) fieldsUpdated.push("reach");
    if (metrics.profileVisits > 0) fieldsUpdated.push("profileVisits");
    if (metrics.saves > 0) fieldsUpdated.push("saves");

    const reachDaily = latestInsightValues(reachInsight);
    if (reachDaily.length > 0) {
      dailySnapshots = reachDaily.map((d) => ({
        ...d,
        followers: metrics.followers,
        engagementRate: metrics.engagementRate,
      }));
    }

    const engagedTotal = sumInsightValues(engaged);
    if (metrics.reach > 0 && engagedTotal > 0) {
      metrics.engagementRate =
        Math.round((engagedTotal / metrics.reach) * 1000) / 10;
      fieldsUpdated.push("engagementRate");
    } else if ((profile.followers_count ?? 0) < 100) {
      warnings.push(
        "Account has fewer than 100 followers — Meta may return empty insights; enter engagement manually if needed.",
      );
      insightsAvailable = false;
    }
  } catch (err) {
    insightsAvailable = false;
    const msg = err instanceof Error ? err.message : String(err);
    warnings.push(`Insights unavailable (${msg}). Profile counts were still fetched.`);
  }

  if (dailySnapshots.length === 0 && metrics.followers > 0) {
    dailySnapshots = [
      {
        date: new Date().toISOString().slice(0, 10),
        followers: metrics.followers,
        reach: metrics.reach,
        engagementRate: metrics.engagementRate,
      },
    ];
  }

  return { metrics, dailySnapshots, fieldsUpdated, insightsAvailable, warnings };
}
