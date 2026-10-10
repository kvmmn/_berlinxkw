import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { vazirmatn } from "@/lib/fonts";
import {
  SITE_HERO_HEADLINE,
  SITE_META_DESCRIPTION,
  siteDocumentTitle,
} from "@/lib/site-brand";
import "./globals.css";

export const metadata: Metadata = {
  title: siteDocumentTitle(),
  description: SITE_META_DESCRIPTION,
  openGraph: {
    title: SITE_HERO_HEADLINE,
    description: SITE_META_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_HERO_HEADLINE,
    description: SITE_META_DESCRIPTION,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={vazirmatn.variable}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
