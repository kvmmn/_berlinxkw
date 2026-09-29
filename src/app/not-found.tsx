import type { Viewport } from "next";
import Link from "next/link";
import { PublicSiteShell } from "@/components/PublicSiteShell";

export const viewport: Viewport = {
  themeColor: "#f3f3ef",
};

export default function NotFound() {
  return (
    <PublicSiteShell footerNote="original tablos · berlin">
      <div className="bk-public-not-found">
        <p className="bk-meta">404</p>
        <h1 className="bk-public-not-found-title">page not found</h1>
        <p className="bk-meta bk-public-not-found-copy">
          This tablo or page is not listed. Head back to the shop or home.
        </p>
        <div className="bk-landing-actions">
          <Link href="/shop" className="bk-btn bk-btn-primary">
            view shop
          </Link>
          <Link href="/" className="bk-btn">
            home
          </Link>
        </div>
      </div>
    </PublicSiteShell>
  );
}
