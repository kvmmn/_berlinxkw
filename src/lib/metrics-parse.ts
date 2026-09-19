import type { DailySnapshot, WeekMetrics } from "./types";

export function parseWeekMetrics(raw: unknown): WeekMetrics | null {
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

export function parseDailySnapshots(raw: unknown): DailySnapshot[] | undefined {
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
