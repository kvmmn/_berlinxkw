"use client";

import { useRef, useState } from "react";
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
  const [importText, setImportText] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncCfg, setSyncCfg] = useState(syncConfig);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);

  const source: MetricsSource = week.metricsSource ?? "demo";

  const applyWeekResponse = (j: {
    metrics?: WeekMetrics;
    dailySnapshots?: DailySnapshot[];
    summary?: string;
    metricsSource?: MetricsSource;
  }) => {
    if (j.metrics) setMetrics(j.metrics);
    if (j.dailySnapshots) setDailyJson(JSON.stringify(j.dailySnapshots, null, 2));
    if (j.summary) setSummary(j.summary);
    setWeek((w) => ({
      ...w,
      metrics: j.metrics ?? w.metrics,
      metricsSource: j.metricsSource ?? w.metricsSource,
      dailySnapshots: j.dailySnapshots ?? w.dailySnapshots,
      summary: j.summary ?? w.summary,
      metricsUpdatedAt: new Date().toISOString(),
    }));
  };

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
    applyWeekResponse({ ...j, metricsSource: j.metricsSource ?? "manual" });
    setStatus("ذخیره شد · live (manual) / saved");
  };

  const importInsights = async () => {
    setStatus(null);
    setError(null);
    if (!importText.trim() && !importFile) {
      setError("Paste Insights text or choose a screenshot");
      return;
    }
    setImporting(true);
    try {
      const form = new FormData();
      if (importText.trim()) form.set("text", importText.trim());
      if (importFile) form.set("image", importFile);

      const res = await fetch("/api/metrics/import", { method: "POST", body: form });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        metricsSource?: MetricsSource;
        metrics?: WeekMetrics;
        dailySnapshots?: DailySnapshot[];
        summary?: string;
      };
      if (!res.ok) {
        setError(j.error ?? "Import failed");
        return;
      }
      applyWeekResponse({ ...j, metricsSource: j.metricsSource ?? "import" });
      setImportText("");
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatus("وارد شد · live (import) / imported from Insights");
    } finally {
      setImporting(false);
    }
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
      <p
        dir="auto"
        className="bk-persian"
        style={{ fontSize: "0.875rem", color: "var(--bk-gray-45)", maxWidth: 640 }}
      >
        Real numbers without Meta API: save manually or paste/upload a weekly Insights snapshot from
        the Instagram app (Persian or English). No Postiz or paid scrapers. Current week:{" "}
        <span className="bk-accent">{week.label}</span>
        {week.metricsUpdatedAt ? (
          <span className="bk-meta" style={{ display: "block", fontSize: "0.7rem", marginTop: 4 }}>
            updated {new Date(week.metricsUpdatedAt).toLocaleString()}
          </span>
        ) : null}
      </p>

      {error ? <p style={{ color: "#ff6b6b" }}>{error}</p> : null}
      {status ? (
        <p className="bk-meta bk-persian" style={{ color: "var(--bk-gray-95)" }}>
          {status}
        </p>
      ) : null}

      <div
        className="bk-panel"
        style={{
          padding: "0.75rem",
          marginBottom: "1rem",
          borderColor: "var(--bk-gray-45)",
        }}
      >
        <h3 className="bk-meta" style={{ marginTop: 0 }}>
          Insights paste / import
        </h3>
        <p
          dir="auto"
          className="bk-persian"
          style={{ fontSize: "0.8rem", color: "var(--bk-gray-45)", marginTop: 0 }}
        >
          از اپ اینستاگرام → Insights هفته را کپی کنید یا اسکرین‌شات بگیرید. OpenAI ساختار را
          استخراج می‌کند (نیاز به OPENAI_API_KEY).
        </p>
        <label className="bk-meta" style={{ fontSize: "0.7rem", display: "block", marginBottom: "0.5rem" }}>
          pasted Insights text
          <textarea
            className="bk-input bk-persian"
            rows={5}
            style={{ width: "100%", marginTop: 4, fontSize: "0.875rem" }}
            placeholder="Followers, reach, engagement… / دنبال‌کننده، بازدید، …"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            dir="auto"
          />
        </label>
        <label className="bk-meta" style={{ fontSize: "0.7rem", display: "block", marginBottom: "0.75rem" }}>
          or screenshot (PNG/JPG, max 4 MB)
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/*"
            className="bk-metrics-file-input"
            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          className="bk-btn bk-btn-primary"
          disabled={importing}
          onClick={() => void importInsights()}
        >
          {importing ? "importing…" : "import from Insights"}
        </button>
      </div>

      <div className="bk-metrics-grid">
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
          className="bk-input bk-persian"
          rows={3}
          style={{ width: "100%", marginTop: 4, fontSize: "0.875rem" }}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          dir="auto"
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
        {syncCfg.configured ? (
          <button
            type="button"
            className="bk-btn"
            disabled={syncing}
            title="Optional Meta Graph API — often blocked by app review"
            onClick={() => void syncInstagram()}
          >
            {syncing ? "syncing…" : "Sync from Instagram (Meta API)"}
          </button>
        ) : null}
      </div>
      <p
        dir="auto"
        className="bk-persian"
        style={{ fontSize: "0.8rem", color: "var(--bk-gray-45)", marginTop: "0.75rem" }}
      >
        {syncCfg.hint.fa}
        <br />
        {syncCfg.hint.en}
      </p>
    </section>
  );
}
