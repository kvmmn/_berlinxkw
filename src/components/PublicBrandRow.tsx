import Link from "next/link";
import { BrandLockup } from "@/components/BrandLockup";

export function PublicBrandRow({
  variant = "header",
  href,
}: {
  variant?: "header" | "hero";
  href?: string;
}) {
  const lockupSize = variant === "hero" ? "lg" : "header";

  const row = (
    <span className={`bk-public-brand bk-public-brand--${variant}`}>
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
