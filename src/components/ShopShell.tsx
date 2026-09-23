import Link from "next/link";
import { BrandLockup } from "@/components/BrandLockup";
import { BrandLogoMark } from "@/components/BrandLogoMark";

export function ShopShell({
  children,
  meta,
}: {
  children: React.ReactNode;
  meta?: string;
}) {
  return (
    <div className="bk-shop-root">
      <header className="bk-shop-header">
        <Link href="/" className="bk-shop-brand" aria-label="berlin × kawe home">
          <BrandLogoMark size={40} />
          <BrandLockup size="md" />
        </Link>
        <div className="bk-shop-header-end">
          {meta ? <p className="bk-meta bk-shop-meta">{meta}</p> : null}
          <nav aria-label="Shop" className="bk-shop-nav">
            <Link href="/shop" className="bk-shop-nav-link">
              all tablos
            </Link>
          </nav>
        </div>
      </header>
      <main id="main-content" className="bk-shop-main">
        {children}
      </main>
      <footer className="bk-shop-footer bk-meta">
        <span>original tablos · berlin</span>
        <Link href="/login" className="bk-shop-footer-link">
          advisor
        </Link>
      </footer>
    </div>
  );
}
