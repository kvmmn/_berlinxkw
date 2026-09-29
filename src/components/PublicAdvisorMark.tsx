import {
  ADVISOR_BEAR_PATHS,
  ADVISOR_BEAR_TRACE_HEIGHT,
  ADVISOR_BEAR_VIEWBOX,
} from "@/lib/advisor-bear-path";

/**
 * Flat Berlin bear from logo.png trace (portal mark), ink only — no orb or lime.
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
        fillRule="nonzero"
      >
        {ADVISOR_BEAR_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
