import { Newsreader, Vazirmatn } from "next/font/google";

/** Portal / login Persian UI — scoped on `.bk-portal-root` and login layout, not public shop. */
export const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-vazirmatn",
  preload: false,
});

/** Public product material line (German) — light serif contrast to mono/grotesque. */
export const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
  variable: "--font-newsreader",
  preload: true,
});
