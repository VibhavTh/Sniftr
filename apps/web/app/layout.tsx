import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScentlyMax - Fragrance Discovery",
  description: "Discover your perfect fragrance",
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
