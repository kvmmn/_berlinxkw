"use client";

import { useEffect, useState } from "react";
import { MetricsControl } from "@/components/MetricsControl";
import type { Week } from "@/lib/types";

type SystemPayload = {
  agents: {
    id: string;
    nameEn: string;
    nameFa: string;
    roleEn: string;
    roleFa: string;
  }[];
  storage: { appState: string; checkpoints: string };
  tracing: {
    langsmith: boolean;
    langfuse: boolean;
    langsmithProject: string;
    langsmithUrl: string | null;
  };
  brainMemory: string;
  currentWeek: Week;
  instagramSync: {
    configured: boolean;
    hint: { en: string; fa: string };
  };
};

export function SystemControl({ initial }: { initial: SystemPayload }) {
  const [data, setData] = useState(initial);
  const [brainMemory, setBrainMemory] = useState(initial.brainMemory);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/system")
      .then((r) => r.json())
      .then((json) => {
        setData(json as SystemPayload);
        setBrainMemory((json as SystemPayload).brainMemory);
      })
      .catch(() => {});
  }, []);

  const saveBrainMemory = async () => {
    setSaveStatus(null);
    setError(null);
    const res = await fetch("/api/system", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brainMemory }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "Save failed");
      return;
    }
    setSaveStatus("ذخیره شد / saved");
  };

  return (
    <div>
      <p className="bk-meta" style={{ color: "var(--bk-gray-70)" }}>
        راهبری سیستم · berlin × kawe OS
      </p>
      <h1 className="bk-display" style={{ fontSize: "var(--bk-size-heading)", margin: "0 0 1rem" }}>
        Agents & steering
      </h1>
      <p dir="auto" style={{ color: "var(--bk-gray-45)", maxWidth: 640, marginBottom: "1.5rem" }}>
        این صفحه کنترل پایدار OS است: متخصصان LangGraph، حافظه thread، و متن راهبری founder (
        brainMemory).
      </p>

      <section className="bk-panel" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
        <h2 className="bk-meta" style={{ marginTop: 0 }}>
          Storage & tracing
        </h2>
        <ul style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
          <li>
            App state: <span className="bk-accent">{data.storage.appState}</span>
          </li>
          <li>
            LangGraph checkpoints: <span className="bk-accent">{data.storage.checkpoints}</span>
          </li>
          <li>
            LangSmith tracing:{" "}
            <span className="bk-accent">{data.tracing.langsmith ? "on" : "off"}</span>
            {data.tracing.langsmithUrl ? (
              <>
                {" "}
                ·{" "}
                <a href={data.tracing.langsmithUrl} target="_blank" rel="noreferrer">
                  project {data.tracing.langsmithProject}
                </a>
              </>
            ) : null}
          </li>
          <li>
            Langfuse: <span className="bk-accent">{data.tracing.langfuse ? "on" : "off"}</span>
          </li>
        </ul>
      </section>

      <MetricsControl initialWeek={initial.currentWeek} syncConfig={initial.instagramSync} />

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 className="bk-meta">Agents</h2>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {data.agents.map((a) => (
            <div key={a.id} className="bk-panel" style={{ padding: "0.75rem 1rem" }} dir="auto">
              <div className="bk-meta" style={{ color: "var(--bk-lime)", fontSize: "0.65rem" }}>
                {a.id}
              </div>
              <div style={{ fontWeight: 600 }}>
                {a.nameFa} · {a.nameEn}
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--bk-gray-45)" }}>{a.roleFa}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--bk-gray-70)" }}>{a.roleEn}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="bk-meta">brainMemory (founder steering)</h2>
        <p dir="auto" style={{ fontSize: "0.875rem", color: "var(--bk-gray-45)" }}>
          استراتژی پایدار، اهداف فصل، و یادداشت‌های راهبری — همه agentها از get_portal_state /
          get_brand_rules می‌خوانند.
        </p>
        {error ? <p style={{ color: "#ff6b6b" }}>{error}</p> : null}
        {saveStatus ? (
          <p className="bk-meta" style={{ color: "var(--bk-lime)" }}>
            {saveStatus}
          </p>
        ) : null}
        <textarea
          className="bk-input"
          rows={16}
          value={brainMemory}
          onChange={(e) => setBrainMemory(e.target.value)}
          style={{ width: "100%", fontFamily: "monospace", fontSize: "0.8rem" }}
        />
        <button
          type="button"
          className="bk-btn bk-btn-primary"
          style={{ marginTop: "0.75rem" }}
          onClick={() => void saveBrainMemory()}
        >
          save brainMemory
        </button>
      </section>
    </div>
  );
}
