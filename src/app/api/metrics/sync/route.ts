import { NextResponse } from "next/server";
import { getCurrentWeek } from "@/lib/brain";
import {
  fetchInstagramMetricsForWeek,
  instagramSyncHint,
  isInstagramSyncConfigured,
} from "@/lib/instagram-metrics";
import { loadState, saveState } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    configured: isInstagramSyncConfigured(),
    hint: instagramSyncHint(),
  });
}

export async function POST() {
  if (!isInstagramSyncConfigured()) {
    return NextResponse.json(
      {
        error: "Instagram sync not configured",
        configured: false,
        hint: instagramSyncHint(),
      },
      { status: 400 },
    );
  }

  let syncResult;
  try {
    syncResult = await fetchInstagramMetricsForWeek();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message, configured: true }, { status: 502 });
  }

  const { state } = await loadState();
  const week = getCurrentWeek(state);

  week.metrics = syncResult.metrics;
  week.dailySnapshots = syncResult.dailySnapshots;
  week.metricsSource = "meta";
  week.metricsUpdatedAt = new Date().toISOString();

  const { ok, mode } = await saveState(state);
  if (!ok) {
    return NextResponse.json(
      { error: "Fetched from Meta but could not persist (read-only storage?)", mode },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    mode,
    weekId: week.id,
    metricsSource: "meta",
    metrics: week.metrics,
    dailySnapshots: week.dailySnapshots,
    fieldsUpdated: syncResult.fieldsUpdated,
    insightsAvailable: syncResult.insightsAvailable,
    warnings: syncResult.warnings,
  });
}
