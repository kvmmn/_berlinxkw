/** Flat vector mark traced from `public/logo.png` — renders via CSS mask + currentColor. */
export function BrandLogoMarkFlat({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`bk-logo-mark-flat ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
