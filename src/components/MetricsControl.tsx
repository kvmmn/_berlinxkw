"use client";

import { useState } from "react";
import { MetricsSourceBadge } from "@/components/MetricsSourceBadge";
import type { DailySnapshot, MetricsSource, Week, WeekMetrics } from "@/lib/types";

type SyncConfig = {
  configured: boolean;
  hint: { en: string; fa: string };
};

export function MetricsControl({
  initialWeek,
  syncConfig,
}: {
  initialWeek: Week;
  syncConfig: SyncConfig;
}) {
  const [week, setWeek] = useState(initialWeek);
  const [metrics, setMetrics] = useState<WeekMetrics>({ ...initialWeek.metrics });
  const [summary, setSummary] = useState(initialWeek.summary);
  const [dailyJson, setDailyJson] = useState(
    JSON.stringify(initialWeek.dailySnapshots, null, 2),
  );
  const [syncCfg, setSyncCfg] = useState(syncConfig);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const source: MetricsSource = week.metricsSource ?? "demo";

  const saveManual = async () => {
    setStatus(null);
    setError(null);
    let dailySnapshots: DailySnapshot[] | undefined;
    try {
      const parsed = JSON.parse(dailyJson) as unknown;
      if (!Array.isArray(parsed)) throw new Error("Daily snapshots must be a JSON array");
      dailySnapshots = parsed as DailySnapshot[];
    } catch {
      setError("Daily snapshots JSON is invalid — fix or use []");
      return;
    }

    const res = await fetch("/api/metrics/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metrics, dailySnapshots, summary }),
    });
    const j = (await res.json().catch(() => ({}))) as {
      error?: string;
      metricsSource?: MetricsSource;
      metrics?: WeekMetrics;
      dailySnapshots?: DailySnapshot[];
      summary?: string;
    };
    if (!res.ok) {
      setError(j.error ?? "Save failed");
      return;
    }
    if (j.metrics) setMetrics(j.metrics);
    if (j.dailySnapshots) setDailyJson(JSON.stringify(j.dailySnapshots, null, 2));
    if (j.summary) setSummary(j.summary);
    setWeek((w) => ({
      ...w,
      metrics: j.metrics ?? metrics,
      metricsSource: j.metricsSource ?? "manual",
      dailySnapshots: j.dailySnapshots ?? w.dailySnapshots,
      summary: j.summary ?? summary,
    }));
    setStatus("ذخیره شد · live (manual) / saved");
  };

  const syncInstagram = async () => {
    setStatus(null);
    setError(null);
    setSyncing(true);
    try {
      const res = await fetch("/api/metrics/sync", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        hint?: { en: string; fa: string };
        metrics?: WeekMetrics;
        dailySnapshots?: DailySnapshot[];
        warnings?: string[];
        fieldsUpdated?: string[];
      };
      if (!res.ok) {
        if (j.hint) setSyncCfg((c) => ({ ...c, hint: j.hint!, configured: false }));
        setError(j.error ?? "Sync failed");
        return;
      }
      if (j.metrics) setMetrics(j.metrics);
      if (j.dailySnapshots) setDailyJson(JSON.stringify(j.dailySnapshots, null, 2));
      setWeek((w) => ({
        ...w,
        metrics: j.metrics ?? w.metrics,
        metricsSource: "meta",
        dailySnapshots: j.dailySnapshots ?? w.dailySnapshots,
      }));
      const warn = j.warnings?.length ? ` · ${j.warnings.join(" ")}` : "";
      setStatus(
        `Meta sync OK (${(j.fieldsUpdated ?? []).join(", ") || "profile"})${warn}`,
      );
    } finally {
      setSyncing(false);
    }
  };

  const setMetric = (key: keyof WeekMetrics, value: string) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    setMetrics((m) => ({ ...m, [key]: n }));
  };

  return (
    <section className="bk-panel" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
      <h2 className="bk-meta" style={{ marginTop: 0 }}>
        Instagram metrics · @berlinxkw
        <MetricsSourceBadge source={source} />
      </h2>
      <p dir="auto" style={{ fontSize: "0.875rem", color: "var(--bk-gray-45)", maxWidth: 640 }}>
        Enter real numbers from Instagram Insights (free) — no Postiz or paid scrapers. Current week:{" "}
        <span className="bk-accent">{week.label}</span>
        {week.metricsUpdatedAt ? (
          <span className="bk-meta" style={{ display: "block", fontSize: "0.7rem", marginTop: 4 }}>
            updated {new Date(week.metricsUpdatedAt).toLocaleString()}
          </span>
        ) : null}
      </p>

      {error ? <p style={{ color: "#ff6b6b" }}>{error}</p> : null}
      {status ? (
        <p className="bk-meta" style={{ color: "var(--bk-lime)" }}>
          {status}
        </p>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        {(
          [
            ["followers", "followers"],
            ["reach", "reach"],
            ["posts", "posts"],
            ["engagementRate", "engagement %"],
            ["saves", "saves"],
            ["profileVisits", "profile visits"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="bk-meta" style={{ fontSize: "0.7rem" }}>
            {label}
            <input
              type="number"
              step={key === "engagementRate" ? "0.1" : "1"}
              className="bk-input"
              style={{ width: "100%", marginTop: 4 }}
              value={metrics[key]}
              onChange={(e) => setMetric(key, e.target.value)}
            />
          </label>
        ))}
      </div>

      <label className="bk-meta" style={{ fontSize: "0.7rem", display: "block", marginBottom: "0.75rem" }}>
        week summary
        <textarea
          className="bk-input"
          rows={3}
          style={{ width: "100%", marginTop: 4, fontSize: "0.875rem" }}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </label>

      <label className="bk-meta" style={{ fontSize: "0.7rem", display: "block", marginBottom: "1rem" }}>
        daily snapshots (JSON array — optional)
        <textarea
          className="bk-input"
          rows={6}
          style={{ width: "100%", marginTop: 4, fontFamily: "monospace", fontSize: "0.75rem" }}
          value={dailyJson}
          onChange={(e) => setDailyJson(e.target.value)}
        />
      </label>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <button type="button" className="bk-btn bk-btn-primary" onClick={() => void saveManual()}>
          save manual metrics
        </button>
        <button
          type="button"
          className="bk-btn"
          disabled={!syncCfg.configured || syncing}
          title={!syncCfg.configured ? syncCfg.hint.en : undefined}
          onClick={() => void syncInstagram()}
        >
          {syncing ? "syncing…" : "Sync from Instagram"}
        </button>
      </div>
      {!syncCfg.configured ? (
        <p dir="auto" style={{ fontSize: "0.8rem", color: "var(--bk-gray-45)", marginTop: "0.75rem" }}>
          {syncCfg.hint.fa}
          <br />
          {syncCfg.hint.en}
        </p>
      ) : null}
    </section>
  );
}
