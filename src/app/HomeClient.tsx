"use client";

import { PageTransition } from "@/components/layout/PageTransition";
import { TimelineHero } from "@/components/timeline/TimelineHero";
import { HorizontalTimeline } from "@/components/timeline/HorizontalTimeline";
import { FilmGrain } from "@/components/effects/FilmGrain";
import { ParticleField } from "@/components/effects/ParticleField";
import type { TimelineRestaurant } from "@/lib/types";

const mockRestaurants: TimelineRestaurant[] = [
  {
    _id: "houston-1",
    name: "Truth BBQ",
    slug: { current: "truth-bbq" },
    cuisine: "Texas BBQ",
    priceRange: "$$",
    heroImage: null as any,
    overallScore: 9.4,
    dateVisited: "2025-12-15",
    summary:
      "Brisket so tender it surrenders on contact. The burnt ends are obsidian jewels of smoky perfection. Worth every minute in line.",
  },
  {
    _id: "houston-2",
    name: "Xochi",
    slug: { current: "xochi" },
    cuisine: "Oaxacan Mexican",
    priceRange: "$$$",
    heroImage: null as any,
    overallScore: 9.1,
    dateVisited: "2025-11-28",
    summary:
      "Mole negro that tastes like it took a village to make. The chocolate tamale dessert is an emotional experience disguised as food.",
  },
  {
    _id: "houston-3",
    name: "Crawfish & Noodles",
    slug: { current: "crawfish-and-noodles" },
    cuisine: "Viet-Cajun",
    priceRange: "$$",
    heroImage: null as any,
    overallScore: 8.8,
    dateVisited: "2025-10-10",
    summary:
      "Where garlic butter meets lemongrass in a muddy, beautiful marriage. Houston in a single bite. Plastic bibs mandatory.",
  },
  {
    _id: "houston-4",
    name: "March",
    slug: { current: "march" },
    cuisine: "Contemporary American",
    priceRange: "$$$$",
    heroImage: null as any,
    overallScore: 9.3,
    dateVisited: "2025-09-05",
    summary:
      "A tasting menu that reads like poetry and tastes like a fever dream. Every course is a thesis statement on Houston's diversity.",
  },
  {
    _id: "houston-5",
    name: "Himalaya",
    slug: { current: "himalaya" },
    cuisine: "Pakistani-Indian",
    priceRange: "$$",
    heroImage: null as any,
    overallScore: 9.0,
    dateVisited: "2025-08-22",
    summary:
      "The fried goat is legendary for a reason. Biryani that could broker peace treaties. A strip-mall cathedral of spice.",
  },
  {
    _id: "houston-6",
    name: "Le Jardinier",
    slug: { current: "le-jardinier" },
    cuisine: "French Vegetable-Forward",
    priceRange: "$$$$",
    heroImage: null as any,
    overallScore: 8.6,
    dateVisited: "2025-07-14",
    summary:
      "Proof that vegetables can be the main character. Every plate is a still life that happens to be edible. The wine list whispers to you.",
  },
];

interface Props {
  restaurants: TimelineRestaurant[];
}

export function HomeClient({ restaurants }: Props) {
  const data = restaurants.length > 0 ? restaurants : mockRestaurants;

  return (
    <PageTransition>
      <FilmGrain />
      <ParticleField count={25} />
      <TimelineHero />
      <HorizontalTimeline restaurants={data} />

      {/* Footer CTA section */}
      <section className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">
          Hungry for more?
        </p>
        <h2 className="mt-4 font-serif text-4xl font-bold md:text-6xl">
          Explore the Full
          <br />
          <span className="text-accent">Journey</span>
        </h2>
        <a
          href="/about"
          data-cursor="magnetic"
          className="mt-8 inline-block border border-accent/30 px-8 py-3 text-xs uppercase tracking-widest text-accent transition-all hover:border-accent hover:bg-accent/10"
        >
          About Rick&apos;s Caf&eacute;
        </a>
      </section>
    </PageTransition>
  );
}
