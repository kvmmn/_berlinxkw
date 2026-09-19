import { runPortalAgentStream } from "@/agents/stream";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "OPENAI_API_KEY is not set. Add it to .env.local for LangGraph Company Brain chat.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const body = (await req.json()) as {
    message?: string;
    sessionId?: string;
    weekId?: string;
    threadId?: string;
  };

  const userText = body.message?.trim();
  const sessionId = body.sessionId;
  const weekId = body.weekId;

  if (!userText || !sessionId || !weekId) {
    return new Response(JSON.stringify({ error: "Missing message, sessionId, or weekId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const threadId = body.threadId ?? sessionId;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of runPortalAgentStream({
          threadId,
          sessionId,
          weekId,
          userText,
        })) {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(
          encoder.encode(`${JSON.stringify({ type: "error", message })}\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
