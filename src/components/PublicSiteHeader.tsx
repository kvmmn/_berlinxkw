import Link from "next/link";
import { PublicBrandRow } from "@/components/PublicBrandRow";
import { PUBLIC_INSTAGRAM_URL } from "@/lib/public-social";

export function PublicSiteHeader() {
  return (
    <header className="bk-public-header">
      <div className="bk-public-shell bk-public-header-inner">
        <PublicBrandRow variant="header" href="/" />
        <nav aria-label="Primary" className="bk-public-nav">
          <Link href="/shop" className="bk-public-nav-link">
            shop
          </Link>
          <a
            href={PUBLIC_INSTAGRAM_URL}
            className="bk-public-nav-link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram @berlinxkw"
          >
            Instagram
          </a>
        </nav>
      </div>
    </header>
  );
}
