import Link from "next/link";
import { BrandLockup } from "@/components/BrandLockup";
import { BrandLogoMark } from "@/components/BrandLogoMark";

export default function Home() {
  return (
    <div className="bk-landing">
      <header className="bk-landing-header bk-meta">
        <Link href="/shop" className="bk-landing-nav-link">
          shop
        </Link>
        <Link href="/login" className="bk-landing-nav-link">
          advisor
        </Link>
      </header>
      <main className="bk-landing-main">
        <BrandLogoMark size={96} priority variant="png" />
        <h1 className="bk-display bk-landing-title">
          <BrandLockup size="lg" />
        </h1>
        <p className="bk-meta bk-landing-tagline">berlin-native tablos · archival mono</p>
        <div className="bk-landing-actions">
          <Link href="/shop" className="bk-btn bk-btn-primary">
            view shop
          </Link>
          <Link href="https://instagram.com/berlinxkw" className="bk-btn" target="_blank" rel="noopener noreferrer">
            @berlinxkw
          </Link>
        </div>
      </main>
      <footer className="bk-landing-footer bk-meta">
        <span>original works · berlin</span>
      </footer>
    </div>
  );
}
