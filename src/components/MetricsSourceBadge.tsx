import { metricsSourceLabel } from "@/lib/metrics-provenance";
import type { MetricsSource } from "@/lib/types";

const BADGE_STYLES: Record<
  ReturnType<typeof metricsSourceLabel>["badgeClass"],
  { border: string; color: string; background: string }
> = {
  demo: {
    border: "var(--bk-gray-45)",
    color: "var(--bk-gray-70)",
    background: "transparent",
  },
  manual: {
    border: "var(--bk-lime)",
    color: "var(--bk-lime)",
    background: "rgba(200, 255, 0, 0.08)",
  },
  import: {
    border: "#c4a8ff",
    color: "#c4a8ff",
    background: "rgba(196, 168, 255, 0.1)",
  },
  meta: {
    border: "#6eb5ff",
    color: "#6eb5ff",
    background: "rgba(110, 181, 255, 0.08)",
  },
};

export function MetricsSourceBadge({ source }: { source: MetricsSource }) {
  const { en, fa, badgeClass } = metricsSourceLabel(source);
  const style = BADGE_STYLES[badgeClass];
  return (
    <span
      className="bk-meta"
      title={fa}
      aria-label={`${en} — ${fa}`}
      style={{
        display: "inline-block",
        fontSize: "0.65rem",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "0.2rem 0.5rem",
        border: `1px solid ${style.border}`,
        color: style.color,
        background: style.background,
        marginLeft: "0.5rem",
        verticalAlign: "middle",
      }}
    >
      {en}
    </span>
  );
}
