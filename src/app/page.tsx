import Link from "next/link";
import { PublicSiteShell } from "@/components/PublicSiteShell";
import { TabloJustifiedGallery } from "@/components/TabloJustifiedGallery";
import { TabloShopGridTile } from "@/components/TabloShopGridTile";
import { planTabloGalleryLayout } from "@/lib/tablo-gallery-layout";
import { prepareShopTablos } from "@/lib/tablo-shop-prepare";
import { tablosWithLayout } from "@/lib/tablo-shop-list";
import {
  COLLECTION_FOOTER,
  COLLECTION_HOME_ALL_LINK,
  COLLECTION_HOME_SECTION,
  SITE_HERO_HEADLINE,
  SITE_HERO_SUBLINE,
} from "@/lib/site-brand";
import { withPublicTabloImages } from "@/lib/tablo-media";
import { tablosFromState } from "@/lib/tablo-store";
import { loadState } from "@/lib/storage";

export const dynamic = "force-dynamic";

export const viewport = {
  themeColor: "#f3f3ef",
};

export default async function Home() {
  const { state } = await loadState();
  const tablos = prepareShopTablos(
    withPublicTabloImages(
      [...tablosFromState(state)]
        .filter((t) => t.status === "listed")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    ),
  );
  const layout = planTabloGalleryLayout(await tablosWithLayout(tablos));

  return (
    <PublicSiteShell footerNote={COLLECTION_FOOTER}>
      <div className="bk-landing-page">
        <section className="bk-landing-hero" aria-labelledby="landing-headline">
          <h1 id="landing-headline" className="bk-landing-headline">
            {SITE_HERO_HEADLINE}
          </h1>
          <p id="landing-tagline" className="bk-meta bk-landing-tagline bk-landing-hero-lead">
            {SITE_HERO_SUBLINE}
          </p>
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
                {COLLECTION_HOME_SECTION}
              </h2>
              <Link href="/shop" className="bk-meta bk-landing-gallery-all">
                {COLLECTION_HOME_ALL_LINK}
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
