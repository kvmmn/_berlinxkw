import Link from "next/link";
import { BrandLockup } from "@/components/BrandLockup";
import { BrandLogoMark } from "@/components/BrandLogoMark";
import { TabloGalleryTile } from "@/components/TabloGalleryTile";
import { withPublicTabloImages } from "@/lib/tablo-media";
import { tablosFromState } from "@/lib/tablo-store";
import { loadState } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { state } = await loadState();
  const tablos = withPublicTabloImages(
    [...tablosFromState(state)]
      .filter((t) => t.status === "listed")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  );

  return (
    <div className="bk-landing">
      <a href="#main-content" className="bk-skip-link">
        Skip to content
      </a>
      <header className="bk-landing-header bk-meta">
        <nav aria-label="Primary">
          <ul className="bk-landing-nav">
            <li>
              <Link href="/shop" className="bk-landing-nav-link">
                shop
              </Link>
            </li>
            <li>
              <Link href="/login" className="bk-landing-nav-link">
                advisor
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main id="main-content" className="bk-landing-main">
        <section className="bk-landing-hero" aria-labelledby="landing-title">
          <BrandLogoMark size={96} priority variant="png" />
          <h1 id="landing-title" className="bk-display bk-landing-title">
            <BrandLockup size="lg" />
          </h1>
          <p className="bk-meta bk-landing-tagline">berlin-native tablos · archival mono</p>
          <div className="bk-landing-actions">
            <Link href="/shop" className="bk-btn bk-btn-primary">
              view shop
            </Link>
            <Link
              href="https://instagram.com/berlinxkw"
              className="bk-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              @berlinxkw
            </Link>
          </div>
        </section>

        {tablos.length > 0 ? (
          <section className="bk-landing-gallery-section" aria-labelledby="landing-tablos-heading">
            <div className="bk-landing-gallery-head">
              <h2 id="landing-tablos-heading" className="bk-meta bk-landing-gallery-label">
                listed tablos
              </h2>
              <Link href="/shop" className="bk-meta bk-landing-gallery-all">
                all works
              </Link>
            </div>
            <ul className="bk-landing-gallery">
              {tablos.map((tablo, index) => (
                <li key={tablo.id}>
                  <TabloGalleryTile tablo={tablo} priority={index === 0} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <footer className="bk-landing-footer bk-meta">
        <span>original works · berlin</span>
      </footer>
    </div>
  );
}
