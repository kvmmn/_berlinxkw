import { NextResponse } from "next/server";
import { getCurrentWeek } from "@/lib/brain";
import { loadState, saveState } from "@/lib/storage";
import type { DailySnapshot, WeekMetrics } from "@/lib/types";

export const runtime = "nodejs";

function parseMetrics(raw: unknown): WeekMetrics | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  const num = (k: keyof WeekMetrics) => {
    const v = m[k];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  };
  const followers = num("followers");
  const reach = num("reach");
  const posts = num("posts");
  const engagementRate = num("engagementRate");
  const saves = num("saves");
  const profileVisits = num("profileVisits");
  if (
    followers == null ||
    reach == null ||
    posts == null ||
    engagementRate == null ||
    saves == null ||
    profileVisits == null
  ) {
    return null;
  }
  return { followers, reach, posts, engagementRate, saves, profileVisits };
}

function parseDailySnapshots(raw: unknown): DailySnapshot[] | undefined {
  if (raw == null) return undefined;
  if (!Array.isArray(raw)) return undefined;
  const out: DailySnapshot[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const d = item as Record<string, unknown>;
    if (
      typeof d.date !== "string" ||
      typeof d.followers !== "number" ||
      typeof d.reach !== "number" ||
      typeof d.engagementRate !== "number"
    ) {
      continue;
    }
    out.push({
      date: d.date,
      followers: d.followers,
      reach: d.reach,
      engagementRate: d.engagementRate,
    });
  }
  return out;
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    metrics?: unknown;
    dailySnapshots?: unknown;
    summary?: string;
    weekId?: string;
  };

  const metrics = parseMetrics(body.metrics);
  if (!metrics) {
    return NextResponse.json(
      {
        error:
          "metrics object required with followers, reach, posts, engagementRate, saves, profileVisits (numbers)",
      },
      { status: 400 },
    );
  }

  const { state } = await loadState();
  const current = getCurrentWeek(state);
  const week =
    body.weekId != null
      ? state.weeks.find((w) => w.id === body.weekId) ?? current
      : current;

  week.metrics = metrics;
  week.metricsSource = "manual";
  week.metricsUpdatedAt = new Date().toISOString();

  const daily = parseDailySnapshots(body.dailySnapshots);
  if (daily !== undefined) {
    week.dailySnapshots = daily;
  }

  if (typeof body.summary === "string" && body.summary.trim()) {
    week.summary = body.summary.trim();
  }

  const { ok, mode } = await saveState(state);
  if (!ok) {
    return NextResponse.json(
      { error: "Could not save metrics (read-only storage?)", mode },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    mode,
    weekId: week.id,
    metricsSource: week.metricsSource,
    metrics: week.metrics,
    dailySnapshots: week.dailySnapshots,
    summary: week.summary,
  });
}
