import type { Week, Decision, MetricsSource } from "@/lib/types";
import { IdeasOpenChip } from "@/components/IdeasOpenChip";
import { MetricsSourceBadge } from "@/components/MetricsSourceBadge";
import { getWeekMetricsSource } from "@/lib/metrics-provenance";

function delta(current: number, previous?: number): string {
  if (previous == null) return "—";
  const d = current - previous;
  const sign = d > 0 ? "+" : "";
  return `${sign}${d}`;
}

export function WeeklyReport({
  week,
  previousWeek,
  decisions,
  openIdeasCount = 0,
  metricsSource,
}: {
  week: Week;
  previousWeek?: Week;
  decisions: Decision[];
  openIdeasCount?: number;
  metricsSource?: MetricsSource;
}) {
  const m = week.metrics;
  const pm = previousWeek?.metrics;
  const source = metricsSource ?? getWeekMetricsSource(week);

  return (
    <div className="bk-weekly-grid">
      <section>
        <IdeasOpenChip count={openIdeasCount} />
        <p className="bk-meta" style={{ color: "var(--bk-gray-70)", margin: "0 0 1rem" }}>
          {week.label} / primary report
          <MetricsSourceBadge source={source} />
        </p>
        <h1
          className="bk-display"
          style={{ fontSize: "var(--bk-size-display)", margin: "0 0 1rem", maxWidth: "18ch" }}
        >
          The city keeps editing itself.
        </h1>
        <p style={{ color: "var(--bk-gray-70)", maxWidth: "42ch", marginBottom: "2rem" }}>
          {week.summary}
        </p>

        <div
          className="bk-panel"
          style={{
            padding: "1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "1.25rem",
          }}
        >
          <Metric label="followers" value={m.followers} delta={delta(m.followers, pm?.followers)} />
          <Metric label="reach" value={m.reach.toLocaleString()} delta={delta(m.reach, pm?.reach)} />
          <Metric label="posts" value={m.posts} delta={delta(m.posts, pm?.posts)} />
          <Metric
            label="engagement"
            value={`${m.engagementRate}%`}
            delta={
              pm
                ? `${(m.engagementRate - pm.engagementRate).toFixed(1)}pp`
                : "—"
            }
          />
          <Metric label="saves" value={m.saves} delta={delta(m.saves, pm?.saves)} />
          <Metric
            label="profile visits"
            value={m.profileVisits}
            delta={delta(m.profileVisits, pm?.profileVisits)}
          />
        </div>
      </section>

      <aside>
        <p className="bk-meta" style={{ color: "var(--bk-gray-70)", margin: "0 0 1rem" }}>
          metadata
        </p>
        <dl style={{ margin: 0, fontSize: "var(--bk-size-meta)" }}>
          <MetaRow k="week start" v={week.startDate} />
          <MetaRow k="instagram" v="@berlinxkw" />
          <MetaRow
            k="metrics"
            v={
              source === "demo"
                ? "demo seed — enter live on /portal/system"
                : source === "manual"
                  ? "live (manual)"
                  : "live (Meta sync)"
            }
          />
          <MetaRow k="status" v="observed" />
          <MetaRow k="posting" v="paused — os build" />
        </dl>

        <p className="bk-meta" style={{ color: "var(--bk-gray-70)", margin: "2rem 0 1rem" }}>
          decisions this week
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {decisions.length === 0 ? (
            <li style={{ color: "var(--bk-gray-45)" }}>No decisions logged yet.</li>
          ) : (
            decisions.map((d) => (
              <li
                key={d.id}
                style={{
                  borderTop: "1px solid var(--bk-border)",
                  padding: "0.75rem 0",
                  fontSize: "0.9375rem",
                }}
              >
                <span className="bk-meta" style={{ color: "var(--bk-gray-95)", fontSize: "0.7rem" }}>
                  {d.status} · {d.owner}
                </span>
                <div>{d.text}</div>
              </li>
            ))
          )}
        </ul>
      </aside>
    </div>
  );
}

function Metric({
  label,
  value,
  delta,
}: {
  label: string;
  value: string | number;
  delta: string;
}) {
  return (
    <div>
      <div className="bk-meta" style={{ color: "var(--bk-gray-45)", fontSize: "0.7rem" }}>
        {label}
      </div>
      <div className="bk-display" style={{ fontSize: "1.75rem" }}>
        {value}
      </div>
      <div className="bk-meta" style={{ color: "var(--bk-gray-70)", fontSize: "0.65rem" }}>
        w/w {delta}
      </div>
    </div>
  );
}

function MetaRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
      <dt className="bk-meta" style={{ color: "var(--bk-gray-45)", margin: 0 }}>
        {k}
      </dt>
      <dd style={{ margin: 0, fontWeight: 700 }}>{v}</dd>
    </div>
  );
}
