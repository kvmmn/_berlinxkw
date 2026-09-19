"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Decision, Session } from "@/lib/types";

export function BrainChat({
  session,
  weekId,
  initialDecisions,
}: {
  session: Session;
  weekId: string;
  initialDecisions: Decision[];
}) {
  const [decisions, setDecisions] = useState(initialDecisions);
  const [logText, setLogText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { sessionId: session.id, weekId },
      }),
    [session.id, weekId],
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("prompt") as HTMLInputElement;
    const text = input.value.trim();
    if (!text) return;
    setError(null);
    sendMessage({ text }).catch(() => {
      setError("Chat failed — check OPENAI_API_KEY.");
    });
    input.value = "";
  };

  const refreshDecisions = useCallback(async () => {
    const res = await fetch(`/api/sessions/${session.id}`);
    if (res.ok) {
      const data = (await res.json()) as { decisions: Decision[] };
      setDecisions(data.decisions);
    }
  }, [session.id]);

  useEffect(() => {
    if (status === "ready") {
      void refreshDecisions();
    }
  }, [status, refreshDecisions]);

  const logDecision = async (text: string, owner: "advisor" | "brain" = "advisor") => {
    const res = await fetch("/api/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session.id,
        weekId,
        text,
        owner,
        status: "accepted",
      }),
    });
    if (!res.ok) {
      setError("Could not save decision (storage may be read-only on this deploy).");
      return;
    }
    await refreshDecisions();
    setLogText("");
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastAssistantText =
    lastAssistant?.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("") ?? "";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1.5rem" }}>
      <section>
        <p className="bk-meta" style={{ color: "var(--bk-gray-70)" }}>
          company brain / session {session.id.slice(-8)}
        </p>
        <h1 className="bk-display" style={{ fontSize: "var(--bk-size-heading)", margin: "0 0 1rem" }}>
          Executive session
        </h1>
        {error ? (
          <p style={{ color: "#ff6b6b", fontSize: "0.875rem" }}>{error}</p>
        ) : null}
        <div
          className="bk-panel"
          style={{
            minHeight: 320,
            maxHeight: "52vh",
            overflow: "auto",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          {messages.length === 0 ? (
            <p style={{ color: "var(--bk-gray-45)" }}>
              Ask for weekly priorities, experiments, or brand-aligned growth calls. The brain
              proposes decisions as{" "}
              <span className="bk-accent">DECISION::</span> lines.
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} style={{ marginBottom: "1rem" }}>
                <div className="bk-meta" style={{ fontSize: "0.65rem", color: "var(--bk-gray-45)" }}>
                  {m.role === "user" ? "advisor" : "brain"}
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {m.parts
                    ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
                    .map((p) => p.text)
                    .join("")}
                </div>
              </div>
            ))
          )}
          {status === "streaming" || status === "submitted" ? (
            <p className="bk-meta" style={{ color: "var(--bk-lime)" }}>
              thinking…
            </p>
          ) : null}
        </div>
        <form onSubmit={onSubmit} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            name="prompt"
            className="bk-input"
            placeholder="What should we prioritize this week?"
            disabled={status !== "ready"}
            autoComplete="off"
          />
          <button type="submit" className="bk-btn bk-btn-primary" disabled={status !== "ready"}>
            send
          </button>
        </form>
        {lastAssistantText ? (
          <button
            type="button"
            className="bk-btn"
            style={{ marginTop: "0.75rem" }}
            onClick={() => logDecision(lastAssistantText.slice(0, 500), "brain")}
          >
            log last reply as decision
          </button>
        ) : null}
      </section>

      <aside>
        <p className="bk-meta" style={{ color: "var(--bk-gray-70)" }}>
          session decisions
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem" }}>
          {decisions.map((d) => (
            <li
              key={d.id}
              style={{
                borderTop: "1px solid var(--bk-border)",
                padding: "0.5rem 0",
                fontSize: "0.875rem",
              }}
            >
              <span className="bk-meta" style={{ fontSize: "0.65rem", color: "var(--bk-lime)" }}>
                {d.status}
              </span>
              <div>{d.text}</div>
              {d.status === "proposed" ? (
                <button
                  type="button"
                  className="bk-btn"
                  style={{ marginTop: "0.35rem", padding: "0.35rem 0.5rem" }}
                  onClick={async () => {
                    const res = await fetch(`/api/decisions/${d.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "accepted" }),
                    });
                    if (res.ok) await refreshDecisions();
                    else setError("Could not accept decision.");
                  }}
                >
                  accept
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <textarea
          className="bk-input"
          rows={3}
          placeholder="Manual decision…"
          value={logText}
          onChange={(e) => setLogText(e.target.value)}
        />
        <button
          type="button"
          className="bk-btn bk-btn-primary"
          style={{ marginTop: "0.5rem", width: "100%" }}
          onClick={() => logText.trim() && logDecision(logText.trim())}
        >
          log decision
        </button>
      </aside>
    </div>
  );
}
