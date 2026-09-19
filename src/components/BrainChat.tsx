"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Decision, Session } from "@/lib/types";
import { renderMarkdownLite } from "@/lib/markdown-lite";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent?: string;
};

const AGENT_LABELS: Record<string, string> = {
  supervisor: "مغز شرکت",
  brand_guardian: "نگهبان برند",
  content_strategist: "استراتژیست محتوا",
  growth_analyst: "تحلیل‌گر رشد",
  decision_scribe: "منشی تصمیم",
};

export function BrainChat({
  session,
  weekId,
  initialDecisions,
}: {
  session: Session;
  weekId: string;
  initialDecisions: Decision[];
}) {
  const [messages, setMessages] = useState<UiMessage[]>(() =>
    session.messages.map((m) => ({
      id: m.id,
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
      agent: m.agent,
    })),
  );
  const [decisions, setDecisions] = useState(initialDecisions);
  const [logText, setLogText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"ready" | "streaming">("ready");
  const [streamingAgent, setStreamingAgent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshDecisions = useCallback(async () => {
    const res = await fetch(`/api/sessions/${session.id}`);
    if (res.ok) {
      const data = (await res.json()) as { decisions: Decision[] };
      setDecisions(data.decisions);
    }
  }, [session.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status, streamingAgent]);

  const sendMessage = async (text: string) => {
    const userMsg: UiMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setStatus("streaming");
    setError(null);
    setStreamingAgent("supervisor");

    const assistantId = `local-a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", agent: "supervisor" },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: session.id,
          weekId,
          threadId: session.id,
        }),
      });

      if (!res.ok || !res.body) {
        const errJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errJson?.error ?? "Chat request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let finalAgent = "supervisor";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as {
            type: string;
            text?: string;
            agent?: string;
            message?: string;
          };

          if (event.type === "agent" && event.agent) {
            setStreamingAgent(event.agent);
            finalAgent = event.agent;
          }
          if (event.type === "token" && event.text) {
            fullText += event.text;
            if (event.agent) finalAgent = event.agent;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: fullText, agent: finalAgent }
                  : m,
              ),
            );
          }
          if (event.type === "done" && event.text) {
            fullText = event.text;
            if (event.agent) finalAgent = event.agent;
          }
          if (event.type === "error") {
            throw new Error(event.message ?? "Stream error");
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: fullText, agent: finalAgent }
            : m,
        ),
      );
      await refreshDecisions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed — check OPENAI_API_KEY.");
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setStatus("ready");
      setStreamingAgent(null);
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("prompt") as HTMLInputElement;
    const text = input.value.trim();
    if (!text || status !== "ready") return;
    input.value = "";
    void sendMessage(text);
  };

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
  const lastAssistantText = lastAssistant?.content ?? "";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1.5rem" }}>
      <section>
        <p className="bk-meta" style={{ color: "var(--bk-gray-70)" }}>
          berlin × kawe OS / session {session.id.slice(-8)}
        </p>
        <h1
          className="bk-display bk-persian"
          style={{ fontSize: "var(--bk-size-heading)", margin: "0 0 1rem" }}
        >
          مشاور · Company Brain
        </h1>
        {error ? (
          <p style={{ color: "#ff6b6b", fontSize: "0.875rem" }}>{error}</p>
        ) : null}
        <div
          ref={scrollRef}
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
            <p dir="auto" className="bk-chat-auto" style={{ color: "var(--bk-gray-45)" }}>
              سلام — اولویت این هفته، آزمایش محتوا، یا بررسی برند را بپرسید.
              <br />
              <span style={{ opacity: 0.75 }}>
                Ask for weekly priorities, inbox ideas, or brand checks. Decisions appear as{" "}
                <span className="bk-accent">DECISION::</span> lines.
              </span>
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="bk-chat-auto" style={{ marginBottom: "1rem" }} dir="auto">
                <div
                  className="bk-meta"
                  style={{ fontSize: "0.65rem", color: "var(--bk-gray-45)" }}
                >
                  {m.role === "user" ? "مشاور / advisor" : "مغز شرکت / brain"}
                  {m.role === "assistant" && m.agent && m.agent !== "supervisor" ? (
                    <span style={{ marginInlineStart: "0.5rem", color: "var(--bk-lime)" }}>
                      · {AGENT_LABELS[m.agent] ?? m.agent}
                    </span>
                  ) : null}
                </div>
                <div
                  style={{ whiteSpace: "pre-wrap" }}
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdownLite(m.content),
                  }}
                />
              </div>
            ))
          )}
          {status === "streaming" ? (
            <p className="bk-meta" style={{ color: "var(--bk-lime)" }} dir="auto">
              {streamingAgent && streamingAgent !== "supervisor"
                ? `${AGENT_LABELS[streamingAgent] ?? streamingAgent}…`
                : "در حال فکر کردن… / thinking…"}
            </p>
          ) : null}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={onSubmit} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            name="prompt"
            className="bk-input"
            placeholder="این هفته روی چه چیزی تمرکز کنیم؟"
            disabled={status !== "ready"}
            autoComplete="off"
            dir="auto"
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
              dir="auto"
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
          dir="auto"
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
