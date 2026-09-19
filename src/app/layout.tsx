import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "berlin × kawe — advisor portal",
  description: "Company Brain operating system for berlin × kawe (@berlinxkw)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
