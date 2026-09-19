import type { Week } from "@/lib/types";

export function DailySummary({ week }: { week: Week }) {
  const snaps = [...week.dailySnapshots].reverse();

  return (
    <div>
      <p className="bk-meta" style={{ color: "var(--bk-gray-70)" }}>
        daily / secondary
      </p>
      <h1 className="bk-display" style={{ fontSize: "var(--bk-size-heading)", margin: "0 0 1rem" }}>
        Pulse
      </h1>
      <p style={{ color: "var(--bk-gray-70)", marginBottom: "2rem" }}>
        Demo snapshots while Instagram is paused. Primary decisions use the weekly report.
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
