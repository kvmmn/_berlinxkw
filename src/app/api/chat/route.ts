import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { v4 as uuidv4 } from "uuid";
import { buildBrainSystemPrompt, extractDecisionsFromAssistantText } from "@/lib/brain";
import { loadState, saveState } from "@/lib/storage";
import type { ChatMessage, Decision } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages: UIMessage[];
    sessionId?: string;
    weekId?: string;
  };

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "OPENAI_API_KEY is not set. Add it to .env.local for streaming Company Brain chat.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const { state } = await loadState();
  const system = buildBrainSystemPrompt(state);
  const sessionId = body.sessionId;
  const weekId = body.weekId;

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system,
    messages: convertToModelMessages(body.messages),
    onFinish: async ({ text }) => {
      if (!sessionId) return;
      const { state: fresh } = await loadState();
      const session = fresh.sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
      const userText =
        lastUser?.parts
          ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("") ?? "";

      if (userText) {
        const userMsg: ChatMessage = {
          id: `m-${uuidv4()}`,
          role: "user",
          content: userText,
          createdAt: new Date().toISOString(),
        };
        session.messages.push(userMsg);
      }

      const assistantMsg: ChatMessage = {
        id: `m-${uuidv4()}`,
        role: "assistant",
        content: text,
        createdAt: new Date().toISOString(),
      };
      session.messages.push(assistantMsg);

      const proposals = extractDecisionsFromAssistantText(text);
      for (const proposal of proposals) {
        const decision: Decision = {
          id: `dec-${uuidv4()}`,
          sessionId,
          weekId: weekId ?? session.weekId,
          text: proposal,
          owner: "brain",
          status: "proposed",
          createdAt: new Date().toISOString(),
        };
        fresh.decisions.push(decision);
        session.decisionIds.push(decision.id);
      }

      await saveState(fresh);
    },
  });

  return result.toUIMessageStreamResponse();
}
