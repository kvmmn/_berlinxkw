import type { Metadata } from "next";
import { vazirmatn } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "berlin × kawe",
  description: "Berlin-native tablos and advisor portal for berlin × kawe (@berlinxkw)",
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
      <body>{children}</body>
    </html>
  );
}
