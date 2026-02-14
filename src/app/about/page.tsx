import { getSiteSettings } from "@/lib/sanity/queries";
import { AboutClient } from "./AboutClient";
import type { SiteSettings } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Rick's Cafe",
  description: "The story behind Rick's Cafe — from tiki torches to a digital culinary world.",
};

export default async function AboutPage() {
  let settings: SiteSettings | null = null;

  try {
    settings = await getSiteSettings();
  } catch {
    // Sanity not connected — use fallback content
  }

  return <AboutClient settings={settings} />;
}
