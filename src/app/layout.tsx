import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Navigation } from "@/components/layout/Navigation";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { CustomCursor } from "@/components/layout/CustomCursor";
import "./globals.css";

const serif = Playfair_Display({
  variable: "--font-serif-var",
  subsets: ["latin"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-sans-var",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rick's Cafe | A Culinary Journey",
  description:
    "Meticulous restaurant reviews documenting a culinary journey — one meal at a time.",
};

export const viewport: Viewport = {
  themeColor: "#1a1410",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="antialiased">
        <SmoothScroll>
          <CustomCursor />
          <Navigation />
          <main className="min-h-screen pb-20 md:pb-0 md:pt-0">
            {children}
          </main>
        </SmoothScroll>
      </body>
    </html>
  );
}
