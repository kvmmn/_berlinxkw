/**
 * Monochrome Berlin bear (same silhouette as portal BrandLogoMark SVG bear).
 * Flat ink on transparent — no orb, glow, or lime.
 */
export function PublicAdvisorMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`bk-public-advisor-mark ${className}`.trim()}
      aria-hidden
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M38 32c-2 4-1 9 2 12-6 2-10 8-8 14 2 7 9 11 16 10 1 5 5 9 10 9s9-4 10-9c7 1 14-3 16-10 2-6-2-12-8-14 3-3 4-8 2-12-2-5-7-8-12-8-3 0-6 1-8 3-2-2-5-3-8-3-5 0-10 3-12 8zm4 6c1-2 3-3 5-3s4 1 5 3c-3 1-5 3-5 6s-2-5-5-6zm14 0c-1-2-3-3-5-3s-4 1-5 3c3 1 5 3 5 6s2-5 5-6zm-9 22c-4 0-7-2-8-5 3 2 7 3 11 3h2c4 0 8-1 11-3-1 3-4 5-8 5h-8z"
      />
      <path
        fill="currentColor"
        d="M44 38h4v6h-4zm12 0h4v6h-4zM46 52c2 1 4 1 6 0v2c-2 1-4 1-6 0v-2z"
      />
    </svg>
  );
}
