import { Vazirmatn } from "next/font/google";

/** Persian/Arabic UI — loaded via Google Fonts; Latin chrome uses type-kit tokens as fallback. */
export const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-vazirmatn",
  preload: true,
});
