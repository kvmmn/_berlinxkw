import { metricsSourceLabel } from "@/lib/metrics-provenance";
import type { MetricsSource } from "@/lib/types";

const BADGE_STYLES: Record<
  ReturnType<typeof metricsSourceLabel>["badgeClass"],
  { border: string; color: string; background: string; borderStyle?: string }
> = {
  demo: {
    border: "var(--bk-gray-45)",
    color: "var(--bk-gray-70)",
    background: "transparent",
    borderStyle: "dashed",
  },
  manual: {
    border: "var(--bk-white)",
    color: "var(--bk-gray-95)",
    background: "transparent",
  },
  import: {
    border: "var(--bk-gray-70)",
    color: "var(--bk-gray-95)",
    background: "transparent",
  },
  meta: {
    border: "var(--bk-gray-95)",
    color: "var(--bk-white)",
    background: "transparent",
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
        border: `1px ${style.borderStyle ?? "solid"} ${style.border}`,
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
