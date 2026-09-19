import "server-only";

import { HumanMessage } from "@langchain/core/messages";
import { getPortalAgentGraph } from "@/agents/graph";
import { SPECIALIST_AGENT_IDS, type AgentId } from "@/agents/brand";
import { buildRunCallbacks } from "@/agents/observability";
import { extractDecisionsFromAssistantText } from "@/lib/brain";
import { loadState, saveState } from "@/lib/storage";
import type { ChatMessage, Decision } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export type StreamEvent =
  | { type: "token"; text: string; agent: string }
  | { type: "agent"; agent: string }
  | { type: "done"; text: string; agent: string }
  | { type: "error"; message: string };

function isAgentId(name: string): name is AgentId {
  return (
    name === "supervisor" ||
    SPECIALIST_AGENT_IDS.includes(name as (typeof SPECIALIST_AGENT_IDS)[number])
  );
}

export async function* runPortalAgentStream(input: {
  threadId: string;
  sessionId: string;
  weekId: string;
  userText: string;
}): AsyncGenerator<StreamEvent> {
  const graph = await getPortalAgentGraph();
  const callbacks = await buildRunCallbacks({
    threadId: input.threadId,
    weekId: input.weekId,
  });

  let activeAgent = "supervisor";
  let fullText = "";

  const configurable = {
    thread_id: input.threadId,
    session_id: input.sessionId,
    week_id: input.weekId,
  };

  const runConfig = {
    configurable,
    callbacks,
    runName: "berlinxkw-portal-chat",
    tags: [
      "berlinxkw",
      `thread:${input.threadId}`,
      `week:${input.weekId}`,
      process.env.VERCEL_ENV ?? "local",
    ],
    metadata: {
      thread_id: input.threadId,
      week_id: input.weekId,
      session_id: input.sessionId,
      env: process.env.VERCEL_ENV ?? "development",
    },
  };

  try {
    for await (const event of graph.streamEvents(
      { messages: [new HumanMessage(input.userText)] },
      { ...runConfig, version: "v2" },
    )) {
      if (event.event === "on_chain_start") {
        const name = event.name ?? "";
        if (isAgentId(name)) {
          activeAgent = name;
          yield { type: "agent", agent: name };
        }
      }

      if (event.event === "on_chat_model_stream") {
        const chunk = event.data?.chunk;
        const content =
          typeof chunk?.content === "string"
            ? chunk.content
            : Array.isArray(chunk?.content)
              ? chunk.content
                  .map((p: { type?: string; text?: string }) =>
                    p?.type === "text" ? p.text ?? "" : "",
                  )
                  .join("")
              : "";
        if (content) {
          fullText += content;
          yield { type: "token", text: content, agent: activeAgent };
        }
      }
    }

    if (!fullText) {
      const snapshot = await graph.getState({ configurable: { thread_id: input.threadId } });
      const messages =
        (snapshot.values as { messages?: { content: unknown }[] }).messages ?? [];
      const last = messages[messages.length - 1];
      fullText =
        typeof last?.content === "string"
          ? last.content
          : JSON.stringify(last?.content ?? "");
    }

    await persistSessionTurn({
      sessionId: input.sessionId,
      weekId: input.weekId,
      userText: input.userText,
      assistantText: fullText,
      agent: activeAgent,
    });

    yield { type: "done", text: fullText, agent: activeAgent };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent stream failed";
    yield { type: "error", message };
  }
}

async function persistSessionTurn(args: {
  sessionId: string;
  weekId: string;
  userText: string;
  assistantText: string;
  agent: string;
}) {
  const { state } = await loadState();
  const session = state.sessions.find((s) => s.id === args.sessionId);
  if (!session) return;

  const userMsg: ChatMessage = {
    id: `m-${uuidv4()}`,
    role: "user",
    content: args.userText,
    createdAt: new Date().toISOString(),
  };
  const assistantMsg: ChatMessage = {
    id: `m-${uuidv4()}`,
    role: "assistant",
    content: args.assistantText,
    createdAt: new Date().toISOString(),
    agent: args.agent,
  };
  session.messages.push(userMsg, assistantMsg);

  const proposals = extractDecisionsFromAssistantText(args.assistantText);
  for (const proposal of proposals) {
    const existing = state.decisions.find(
      (d) => d.sessionId === args.sessionId && d.text === proposal && d.status === "proposed",
    );
    if (existing) continue;
    const decision: Decision = {
      id: `dec-${uuidv4()}`,
      sessionId: args.sessionId,
      weekId: args.weekId,
      text: proposal,
      owner: "brain",
      status: "proposed",
      createdAt: new Date().toISOString(),
    };
    state.decisions.push(decision);
    session.decisionIds.push(decision.id);
  }

  await saveState(state);
}
