import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "shop · berlin × kawe",
  description: "Original Berlin tablos — berlin × kawe",
};

export const viewport: Viewport = {
  themeColor: "#f3f3ef",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
