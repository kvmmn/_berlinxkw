import type { AppState, Week } from "./types";

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

  return `You are the Company Brain (CEO) for berlin × kawe — the growth executive for a Berlin-native brand (@berlinxkw on Instagram).

Voice: decisive, minimal, brand-aware, growth-focused. Speak like an archival operator, not a generic chatbot. Use lowercase for brand name: berlin × kawe (multiplication sign ×, never letter x).

${state.brainMemory}

## Current week (${current.label}, starts ${current.startDate})
Metrics (demo / Instagram paused): followers ${current.metrics.followers}, reach ${current.metrics.reach}, posts ${current.metrics.posts}, engagement ${current.metrics.engagementRate}%, saves ${current.metrics.saves}, profile visits ${current.metrics.profileVisits}.
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

When you propose a concrete decision the advisor should log, end your message with a line:
DECISION:: <one sentence, imperative, measurable>

Do not invent Instagram API actions — posting is paused until the OS ships. Focus on strategy, content system, experiments, and weekly priorities.`;
}

export function extractDecisionsFromAssistantText(text: string): string[] {
  const lines = text.split("\n");
  return lines
    .filter((l) => l.trim().startsWith("DECISION::"))
    .map((l) => l.replace(/^DECISION::\s*/i, "").trim())
    .filter(Boolean);
}
