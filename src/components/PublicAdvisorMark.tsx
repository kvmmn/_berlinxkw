import {
  ADVISOR_BEAR_PATHS,
  ADVISOR_BEAR_TRACE_HEIGHT,
  ADVISOR_BEAR_VIEWBOX,
} from "@/lib/advisor-bear-path";

/**
 * Monochrome portal mark (`public/logo.png`) — ink only, no glow or background.
 */
export function PublicAdvisorMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={ADVISOR_BEAR_VIEWBOX}
      className={`bk-public-advisor-mark ${className}`.trim()}
      aria-hidden
      focusable="false"
    >
      <g
        transform={`translate(0,${ADVISOR_BEAR_TRACE_HEIGHT}) scale(0.1,-0.1)`}
        fill="currentColor"
        fillRule="evenodd"
      >
        {ADVISOR_BEAR_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
