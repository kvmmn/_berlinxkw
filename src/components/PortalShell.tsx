"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLockup } from "@/components/BrandLockup";
import { BrandLogoMark } from "@/components/BrandLogoMark";

const NAV = [
  { href: "/portal", label: "weekly report" },
  { href: "/portal/daily", label: "daily" },
  { href: "/portal/ideas", label: "inbox" },
  { href: "/portal/tablos", label: "shop" },
  { href: "/portal/review", label: "review" },
  { href: "/portal/chat", label: "company brain" },
  { href: "/portal/system", label: "راهبری", persian: true },
] as const;

export function PortalShell({
  children,
  storageNote,
}: {
  children: React.ReactNode;
  storageNote?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="bk-portal-root">
      <header className="bk-portal-header">
        <div className="bk-portal-brand">
          <Link href="/" className="bk-portal-brand-link" aria-label="berlin × kawe home">
            <BrandLogoMark size={36} />
          </Link>
          <span className="bk-meta bk-portal-brand-label">
            <BrandLockup size="sm" /> / advisor portal
          </span>
        </div>
        <nav className="bk-portal-nav" aria-label="Portal sections">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/portal" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`bk-meta bk-portal-nav-link${"persian" in item && item.persian ? " bk-persian" : ""}`}
                data-active={active ? "true" : "false"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {storageNote ? (
        <div className="bk-meta bk-portal-storage-banner">{storageNote}</div>
      ) : null}
      <main className="bk-portal-main">{children}</main>
    </div>
  );
}
