import type { Viewport } from "next";
import { vazirmatn } from "@/lib/fonts";

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className={vazirmatn.variable}>{children}</div>;
}
