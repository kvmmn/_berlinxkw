import Link from "next/link";
import { PublicSiteHeader } from "@/components/PublicSiteHeader";

export function PublicSiteShell({
  children,
  footerNote = "original tablos · berlin",
}: {
  children: React.ReactNode;
  footerNote?: string;
}) {
  return (
    <div className="bk-public-root">
      <a href="#main-content" className="bk-skip-link">
        Skip to content
      </a>
      <PublicSiteHeader />
      <main id="main-content" className="bk-public-main">
        {children}
      </main>
      <footer className="bk-public-footer bk-meta">
        <span>{footerNote}</span>
        <Link href="/login" className="bk-public-footer-link">
          advisor
        </Link>
      </footer>
    </div>
  );
}
