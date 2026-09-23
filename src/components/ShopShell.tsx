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
        <Link href="/shop" className="bk-shop-brand">
          <BrandLogoMark size={40} />
          <BrandLockup size="md" />
        </Link>
        {meta ? <p className="bk-meta bk-shop-meta">{meta}</p> : null}
      </header>
      <main className="bk-shop-main">{children}</main>
      <footer className="bk-shop-footer bk-meta">
        <span>original tablos · berlin</span>
        <Link href="/login" className="bk-shop-footer-link">
          advisor
        </Link>
      </footer>
    </div>
  );
}
