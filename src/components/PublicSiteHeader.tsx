import Link from "next/link";
import { PublicBrandRow } from "@/components/PublicBrandRow";

export function PublicSiteHeader() {
  return (
    <header className="bk-public-header">
      <div className="bk-public-shell bk-public-header-inner">
        <PublicBrandRow variant="header" href="/" />
        <nav aria-label="Primary" className="bk-public-nav">
          <Link href="/shop" className="bk-public-nav-link">
            shop
          </Link>
          <Link href="/login" className="bk-public-nav-link">
            advisor
          </Link>
        </nav>
      </div>
    </header>
  );
}
