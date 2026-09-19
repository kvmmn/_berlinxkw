"use client";

import { useState } from "react";
import type { Decision, Week } from "@/lib/types";

export function WeeklyReview({
  previousWeek,
  decisions,
}: {
  previousWeek: Week;
  decisions: Decision[];
}) {
  const [items, setItems] = useState(decisions);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const unevaluated = items.filter((d) => !d.evaluation);
  const evaluated = items.filter((d) => d.evaluation);

  const submit = async (id: string) => {
    const score = scores[id] ?? 3;
    const res = await fetch(`/api/decisions/${id}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, notes: notes[id] ?? "" }),
    });
    if (!res.ok) {
      setMsg("Could not save evaluation — cloud storage is temporarily unavailable. Try again shortly.");
      return;
    }
    const { decision } = (await res.json()) as { decision: Decision };
    setItems((prev) => prev.map((d) => (d.id === id ? decision : d)));
    setMsg(null);
  };

  return (
    <div>
      <p className="bk-meta" style={{ color: "var(--bk-gray-70)" }}>
        weekly review / {previousWeek.label}
      </p>
      <h1 className="bk-display" style={{ fontSize: "var(--bk-size-heading)", margin: "0 0 0.5rem" }}>
        Evaluate last week
      </h1>
      <p style={{ color: "var(--bk-gray-70)", maxWidth: "48ch", marginBottom: "2rem" }}>
        Score decisions against outcomes ({previousWeek.metrics.followers} followers,{" "}
        {previousWeek.metrics.engagementRate}% engagement). Use notes to feed next week&apos;s
        brain context.
      </p>
      {msg ? <p style={{ color: "#ff6b6b" }}>{msg}</p> : null}

      <section style={{ marginBottom: "2.5rem" }}>
        <h2 className="bk-meta" style={{ color: "var(--bk-lime)", marginBottom: "1rem" }}>
          pending
        </h2>
        {unevaluated.length === 0 ? (
          <p style={{ color: "var(--bk-gray-45)" }}>All decisions evaluated.</p>
        ) : (
          unevaluated.map((d) => (
            <div key={d.id} className="bk-panel" style={{ padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ margin: "0 0 0.75rem" }}>{d.text}</p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                <label className="bk-meta" style={{ fontSize: "0.7rem" }}>
                  score 1–5
                  <input
                    type="number"
                    min={1}
                    max={5}
                    className="bk-input"
                    style={{ width: 64, marginLeft: 8 }}
                    value={scores[d.id] ?? 3}
                    onChange={(e) =>
                      setScores((s) => ({ ...s, [d.id]: Number(e.target.value) }))
                    }
                  />
                </label>
                <input
                  className="bk-input"
                  style={{ flex: 1, minWidth: 200 }}
                  placeholder="optimization notes"
                  value={notes[d.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                />
                <button type="button" className="bk-btn bk-btn-primary" onClick={() => submit(d.id)}>
                  save evaluation
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <section>
        <h2 className="bk-meta" style={{ color: "var(--bk-gray-70)", marginBottom: "1rem" }}>
          evaluated
        </h2>
        {evaluated.map((d) => (
          <div
            key={d.id}
            style={{
              borderTop: "1px solid var(--bk-border)",
              padding: "0.75rem 0",
            }}
          >
            <span className="bk-accent bk-meta" style={{ fontSize: "0.65rem" }}>
              {d.evaluation?.score}/5
            </span>
            <div>{d.text}</div>
            <p style={{ color: "var(--bk-gray-45)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
              {d.evaluation?.notes}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
