import Link from "next/link";
import { PublicAdvisorMark } from "@/components/PublicAdvisorMark";
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
      <main id="main-content" className="bk-public-shell bk-public-main">
        {children}
      </main>
      <footer className="bk-public-footer">
        <div className="bk-public-shell">
          <div className="bk-public-footer-bar bk-meta">
            <span>{footerNote}</span>
            <Link href="/login" className="bk-public-footer-advisor" aria-label="Advisor">
              <PublicAdvisorMark />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
