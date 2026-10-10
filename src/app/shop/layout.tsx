import type { Metadata, Viewport } from "next";
import { COLLECTION_SHOP_INTRO, siteDocumentTitle } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: siteDocumentTitle("shop"),
  description: COLLECTION_SHOP_INTRO,
  openGraph: {
    title: siteDocumentTitle("shop"),
    description: COLLECTION_SHOP_INTRO,
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f3ef",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
