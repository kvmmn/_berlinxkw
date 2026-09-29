import Link from "next/link";
import { BrandLockup } from "@/components/BrandLockup";
import { BrandLogoMarkFlat } from "@/components/BrandLogoMarkFlat";

const MARK_SIZE = {
  header: 28,
  hero: 54,
} as const;

export function PublicBrandRow({
  variant = "header",
  href,
}: {
  variant?: "header" | "hero";
  href?: string;
}) {
  const markSize = MARK_SIZE[variant];
  const lockupSize = variant === "hero" ? "lg" : "md";

  const row = (
    <span className={`bk-public-brand bk-public-brand--${variant}`}>
      <BrandLogoMarkFlat size={markSize} />
      <BrandLockup size={lockupSize} />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="bk-public-brand-link" aria-label="berlin × kawe home">
        {row}
      </Link>
    );
  }

  return row;
}
