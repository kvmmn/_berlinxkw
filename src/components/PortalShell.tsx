"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const NAV = [
  { href: "/portal", label: "weekly report" },
  { href: "/portal/daily", label: "daily" },
  { href: "/portal/ideas", label: "inbox" },
  { href: "/portal/review", label: "review" },
  { href: "/portal/chat", label: "company brain" },
];

export function PortalShell({
  children,
  storageNote,
}: {
  children: React.ReactNode;
  storageNote?: string;
}) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          borderBottom: "1px solid var(--bk-border)",
          padding: "0.75rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Image src="/logo.png" alt="berlin × kawe" width={36} height={36} />
          <span className="bk-meta" style={{ fontSize: "var(--bk-size-meta)" }}>
            berlin × kawe / advisor portal
          </span>
        </div>
        <nav style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/portal" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bk-meta"
                style={{
                  fontSize: "var(--bk-size-meta)",
                  opacity: active ? 1 : 0.55,
                  borderBottom: active ? "1px solid var(--bk-lime)" : "none",
                  paddingBottom: 2,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {storageNote ? (
        <div
          className="bk-meta"
          style={{
            padding: "0.5rem 1.25rem",
            background: "#1a1a00",
            color: "var(--bk-lime)",
            fontSize: "0.75rem",
            borderBottom: "1px solid var(--bk-border)",
          }}
        >
          {storageNote}
        </div>
      ) : null}
      <main style={{ flex: 1, padding: "1.5rem 1.25rem 3rem", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
