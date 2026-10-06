import Link from "next/link";
import { LandingTagline } from "@/components/LandingTagline";
import { PublicSiteShell } from "@/components/PublicSiteShell";
import { TabloJustifiedGallery } from "@/components/TabloJustifiedGallery";
import { TabloShopGridTile } from "@/components/TabloShopGridTile";
import { planTabloGalleryLayout } from "@/lib/tablo-gallery-layout";
import { tablosWithLayout } from "@/lib/tablo-shop-list";
import { withPublicTabloImages } from "@/lib/tablo-media";
import { tablosFromState } from "@/lib/tablo-store";
import { loadState } from "@/lib/storage";

export const dynamic = "force-dynamic";

export const viewport = {
  themeColor: "#f3f3ef",
};

export default async function Home() {
  const { state } = await loadState();
  const tablos = withPublicTabloImages(
    [...tablosFromState(state)]
      .filter((t) => t.status === "listed")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  );
  const layout = planTabloGalleryLayout(await tablosWithLayout(tablos));

  return (
    <PublicSiteShell footerNote="original works · berlin">
      <div className="bk-landing-page">
        <section className="bk-landing-hero" aria-labelledby="landing-tagline">
          <h1 className="bk-sr-only">berlin × kawe</h1>
          <LandingTagline id="landing-tagline" className="bk-landing-hero-lead" />
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

        {layout.items.length > 0 ? (
          <section className="bk-landing-gallery-section" aria-labelledby="landing-tablos-heading">
            <div className="bk-landing-gallery-head">
              <h2 id="landing-tablos-heading" className="bk-meta bk-landing-gallery-label">
                listed tablos
              </h2>
              <Link href="/shop" className="bk-meta bk-landing-gallery-all">
                all works
              </Link>
            </div>
            <TabloJustifiedGallery
              items={layout.items}
              className="bk-landing-gallery"
              renderTile={(item, index) => (
                <TabloShopGridTile
                  tablo={item.tablo}
                  orientation={item.orientation}
                  showBuy={false}
                  priority={index === 0}
                />
              )}
            />
          </section>
        ) : null}
      </div>
    </PublicSiteShell>
  );
}
