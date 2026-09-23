import Link from "next/link";

/** One-line lockup: berlin × kawe (multiplication sign ×), lowercase, tight tracking. */
export function BrandLockup({
  href,
  className = "",
  size = "md",
}: {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const inner = (
    <span className={`bk-lockup bk-lockup--${size} ${className}`.trim()}>
      berlin <span className="bk-lockup-times" aria-hidden="true">×</span> kawe
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="bk-lockup-link">
        {inner}
      </Link>
    );
  }

  return inner;
}
