import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "shop · berlin × kawe",
  description: "Original Berlin tablos — berlin × kawe",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
