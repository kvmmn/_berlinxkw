import {
  ADVISOR_BEAR_PATH_D,
  ADVISOR_BEAR_VIEWBOX,
} from "@/lib/advisor-bear-path";

/**
 * Monochrome portal mark (`public/logo.png`) — candidate B bear + orb outline.
 */
export function PublicAdvisorMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={ADVISOR_BEAR_VIEWBOX}
      preserveAspectRatio="xMaxYMid meet"
      className={`bk-public-advisor-mark ${className}`.trim()}
      aria-hidden
      focusable="false"
    >
      <path fill="currentColor" d={ADVISOR_BEAR_PATH_D} />
    </svg>
  );
}
