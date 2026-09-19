import { getWeekMetricsSource, isLiveMetricsSource } from "./metrics-provenance";
import type { AppState, IdeaInput, Week } from "./types";

export function getCurrentWeek(state: AppState): Week {
  return [...state.weeks].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  )[0];
}

export function getPreviousWeek(state: AppState, current: Week): Week | undefined {
  const sorted = [...state.weeks].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
  const idx = sorted.findIndex((w) => w.id === current.id);
  return sorted[idx + 1];
}

export function buildBrainSystemPrompt(state: AppState): string {
  const current = getCurrentWeek(state);
  const prev = getPreviousWeek(state, current);
  const pendingEval = state.decisions.filter(
    (d) => d.weekId === current.id && !d.evaluation,
  );
  const recentDecisions = state.decisions
    .slice(-8)
    .map(
      (d) =>
        `- [${d.status}] (${d.owner}) ${d.text}${
          d.evaluation ? ` → score ${d.evaluation.score}/5: ${d.evaluation.notes}` : ""
        }`,
    )
    .join("\n");

  const founderIdeas = [...(state.ideas ?? [])]
    .filter((i) => i.status === "inbox" || i.status === "queued")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const ideasBlock = formatFounderIdeasForBrain(founderIdeas);
  const metricsSource = getWeekMetricsSource(current);
  const metricsLive = isLiveMetricsSource(metricsSource);
  const metricsLabel = metricsLive
    ? `LIVE (${metricsSource}) — real advisor-entered or imported numbers`
    : "DEMO SEED — not real @berlinxkw data; do not cite as actual growth";

  return `You are the Company Brain (CEO) for berlin × kawe — the growth executive for a Berlin-native brand (@berlinxkw on Instagram).

Voice: decisive, minimal, brand-aware, growth-focused. Speak like an archival operator, not a generic chatbot. Use lowercase for brand name: berlin × kawe (multiplication sign ×, never letter x).

${state.brainMemory}

## Current week (${current.label}, starts ${current.startDate})
Metrics (${metricsLabel}): followers ${current.metrics.followers}, reach ${current.metrics.reach}, posts ${current.metrics.posts}, engagement ${current.metrics.engagementRate}%, saves ${current.metrics.saves}, profile visits ${current.metrics.profileVisits}.
Summary: ${current.summary}

${
  prev
    ? `## Previous week (${prev.label})
followers ${prev.metrics.followers} → ${current.metrics.followers}, engagement ${prev.metrics.engagementRate}% → ${current.metrics.engagementRate}%.
`
    : ""
}

## Recent decisions
${recentDecisions || "(none yet)"}

## Pending evaluation this week
${pendingEval.map((d) => `- ${d.text}`).join("\n") || "(none)"}

## Founder ideas inbox (high-priority creative fuel)
Treat these as primary operating-system inputs from Kaveh (founder). When proposing weekly content experiments, prioritize turning inbox/queued ideas into concrete posts, series, or tests — cite which idea you are drawing from when relevant.
${ideasBlock}

When you propose a concrete decision the advisor should log, end your message with a line:
DECISION:: <one sentence, imperative, measurable>

Do not invent Instagram API actions — posting is paused until the OS ships. Focus on strategy, content system, experiments, and weekly priorities.`;
}

function formatFounderIdeasForBrain(ideas: IdeaInput[]): string {
  if (ideas.length === 0) return "(no inbox or queued ideas yet)";
  return ideas
    .map((idea) => {
      const mediaSummary =
        idea.media.length === 0
          ? "media: none"
          : `media: ${idea.media.map((m) => `${m.kind}${m.url ? ` (${m.url})` : ""}`).join(", ")}`;
      const tags = idea.tags?.length ? `tags: ${idea.tags.join(", ")}` : "";
      return `- [${idea.status}] "${idea.title}" — ${idea.description}\n  ${mediaSummary}${tags ? `\n  ${tags}` : ""}${idea.notes ? `\n  brain notes: ${idea.notes}` : ""}`;
    })
    .join("\n");
}

export function countOpenIdeas(state: AppState): number {
  return (state.ideas ?? []).filter((i) => i.status === "inbox" || i.status === "queued").length;
}

export function extractDecisionsFromAssistantText(text: string): string[] {
  const lines = text.split("\n");
  return lines
    .filter((l) => l.trim().startsWith("DECISION::"))
    .map((l) => l.replace(/^DECISION::\s*/i, "").trim())
    .filter(Boolean);
}
