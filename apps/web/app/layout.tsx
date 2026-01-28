import type { Metadata } from "next";
import { Cormorant, Inter } from 'next/font/google';
import { FragranceModalProvider } from '@/contexts/FragranceModalContext';
import "./globals.css";

const cormorant = Cormorant({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

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
      <body className={`${inter.variable} ${cormorant.variable} font-sans antialiased`}>
        <FragranceModalProvider>
          {children}
        </FragranceModalProvider>
      </body>
    </html>
  );
}
