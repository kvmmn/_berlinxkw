import "server-only";

import type { BaseCallbackHandler } from "@langchain/core/callbacks/base";

export function isLangSmithTracingEnabled(): boolean {
  const v2 = process.env.LANGCHAIN_TRACING_V2 === "true";
  const smith = process.env.LANGSMITH_TRACING === "true";
  return Boolean(process.env.LANGSMITH_API_KEY && (v2 || smith));
}

export function isLangfuseEnabled(): boolean {
  return Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);
}

export function getLangSmithProjectUrl(): string | null {
  if (!process.env.LANGSMITH_API_KEY) return null;
  const project = process.env.LANGSMITH_PROJECT ?? "berlinxkw";
  return `https://smith.langchain.com/o/default/projects/p/${encodeURIComponent(project)}`;
}

/** Callbacks for a single graph run — LangSmith via env; Langfuse optional. */
export async function buildRunCallbacks(meta: {
  threadId: string;
  weekId?: string;
}): Promise<BaseCallbackHandler[]> {
  const handlers: BaseCallbackHandler[] = [];

  if (isLangfuseEnabled()) {
    try {
      const { CallbackHandler } = await import("langfuse-langchain");
      handlers.push(
        new CallbackHandler({
          publicKey: process.env.LANGFUSE_PUBLIC_KEY,
          secretKey: process.env.LANGFUSE_SECRET_KEY,
          baseUrl: process.env.LANGFUSE_HOST ?? "https://cloud.langfuse.com",
          sessionId: meta.threadId,
          tags: ["berlinxkw", process.env.VERCEL_ENV ?? "local"],
          metadata: {
            thread_id: meta.threadId,
            week_id: meta.weekId,
            env: process.env.VERCEL_ENV ?? "development",
          },
        }),
      );
    } catch {
      // langfuse-langchain optional — skip if package missing
    }
  }

  return handlers;
}

export function applyLangSmithEnvDefaults(): void {
  if (process.env.LANGSMITH_API_KEY && !process.env.LANGCHAIN_TRACING_V2) {
    process.env.LANGCHAIN_TRACING_V2 = "true";
  }
  if (!process.env.LANGSMITH_PROJECT) {
    process.env.LANGSMITH_PROJECT = "berlinxkw";
  }
}
