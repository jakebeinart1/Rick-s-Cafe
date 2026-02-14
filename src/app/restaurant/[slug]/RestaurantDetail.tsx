"use client";

import { motion } from "framer-motion";
import { HeroImage } from "@/components/restaurant/HeroImage";
import { StatsBar } from "@/components/restaurant/StatsBar";
import { ScoreBreakdown } from "@/components/restaurant/ScoreBreakdown";
import { Gallery } from "@/components/restaurant/Gallery";
import type { Restaurant } from "@/lib/types";

interface Props {
  restaurant: Restaurant;
}

export function RestaurantDetail({ restaurant }: Props) {
  const overallScore =
    (restaurant.scores.taste +
      restaurant.scores.vibe +
      restaurant.scores.service +
      restaurant.scores.value) /
    4;

  return (
    <div>
      {/* Hero */}
      {restaurant.gallery?.[0] && (
        <HeroImage
          image={restaurant.gallery[0]}
          restaurantName={restaurant.name}
        />
      )}

      {/* Stats Bar */}
      <StatsBar
        overallScore={overallScore}
        priceRange={restaurant.priceRange}
        cuisine={restaurant.cuisine}
        location={restaurant.location}
      />

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-12 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1fr_300px]">
          {/* Review Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Summary */}
            <p className="mb-8 font-serif text-xl leading-relaxed text-muted md:text-2xl">
              {restaurant.summary}
            </p>

            {/* Date */}
            <p className="mb-8 text-xs uppercase tracking-widest text-muted">
              Visited{" "}
              {new Date(restaurant.dateVisited).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            {/* Full Review (Portable Text would be rendered here) */}
            <div className="prose prose-lg max-w-none">
              {/* When Sanity is connected, use PortableText component here */}
              {typeof restaurant.review === "string" ? (
                <p>{restaurant.review}</p>
              ) : (
                <p className="text-muted">Full review content renders here via Portable Text.</p>
              )}
            </div>
          </motion.div>

          {/* Sidebar: Score Breakdown */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="sticky top-36">
              <ScoreBreakdown
                scores={restaurant.scores}
                rickFactor={restaurant.rickFactor}
              />
            </div>
          </motion.aside>
        </div>

        {/* Gallery Section */}
        {restaurant.gallery && restaurant.gallery.length > 1 && (
          <motion.section
            className="mt-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-8 font-serif text-3xl font-bold">The Experience</h2>
            <Gallery images={restaurant.gallery.slice(1)} />
          </motion.section>
        )}
      </div>
    </div>
  );
}
