import type { MetricsSource, Week } from "@/lib/types";
import { IdeasOpenChip } from "@/components/IdeasOpenChip";
import { MetricsSourceBadge } from "@/components/MetricsSourceBadge";
import { getWeekMetricsSource } from "@/lib/metrics-provenance";

export function DailySummary({
  week,
  openIdeasCount = 0,
  metricsSource,
}: {
  week: Week;
  openIdeasCount?: number;
  metricsSource?: MetricsSource;
}) {
  const source = metricsSource ?? getWeekMetricsSource(week);
  const snaps = [...week.dailySnapshots].reverse();

  return (
    <div>
      <IdeasOpenChip count={openIdeasCount} />
      <p className="bk-meta" style={{ color: "var(--bk-gray-70)" }}>
        daily / secondary
      </p>
      <h1 className="bk-display" style={{ fontSize: "var(--bk-size-heading)", margin: "0 0 1rem" }}>
        Pulse
        <MetricsSourceBadge source={source} />
      </h1>
      <p style={{ color: "var(--bk-gray-70)", marginBottom: "2rem" }}>
        {source === "demo"
          ? "Demo seed snapshots — replace with live numbers on /portal/system (manual or Meta sync)."
          : "Daily snapshots for the current week. Primary decisions use the weekly report."}
      </p>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {snaps.map((s) => (
          <div
            key={s.date}
            className="bk-panel"
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 1fr 1fr",
              gap: "1rem",
              padding: "1rem",
              alignItems: "center",
            }}
          >
            <span className="bk-meta" style={{ fontSize: "0.7rem" }}>
              {s.date}
            </span>
            <Cell label="followers" value={s.followers} />
            <Cell label="reach" value={s.reach.toLocaleString()} />
            <Cell label="engagement" value={`${s.engagementRate}%`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="bk-meta" style={{ fontSize: "0.6rem", color: "var(--bk-gray-45)" }}>
        {label}
      </div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}
