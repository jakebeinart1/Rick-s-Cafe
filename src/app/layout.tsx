import type { Metadata, Viewport } from "next";
import { Cormorant_Garant, Inter, JetBrains_Mono } from "next/font/google";
import { Navigation } from "@/components/layout/Navigation";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { CustomCursor } from "@/components/layout/CustomCursor";
import "./globals.css";

const heading = Cormorant_Garant({
  variable: "--font-heading-var",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const sans = Inter({
  variable: "--font-sans-var",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-var",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rick's Cafe | A Culinary Journey",
  description:
    "Meticulous restaurant reviews documenting a culinary journey — one meal at a time.",
};

export const viewport: Viewport = {
  themeColor: "#1c1638",
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
    <html lang="en" className={`${heading.variable} ${sans.variable} ${mono.variable}`}>
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
