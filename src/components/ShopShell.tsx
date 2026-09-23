import Image from "next/image";
import Link from "next/link";

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
          <Image src="/logo.png" alt="" width={40} height={40} aria-hidden />
          <span className="bk-shop-lockup">
            berlin <span className="bk-shop-times">×</span> kawe
          </span>
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
