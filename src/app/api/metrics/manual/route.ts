import { NextResponse } from "next/server";
import { getCurrentWeek } from "@/lib/brain";
import { loadState, saveState } from "@/lib/storage";
import { parseDailySnapshots, parseWeekMetrics } from "@/lib/metrics-parse";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    metrics?: unknown;
    dailySnapshots?: unknown;
    summary?: string;
    weekId?: string;
  };

  const metrics = parseWeekMetrics(body.metrics);
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
