"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { urlFor } from "@/lib/sanity/client";
import type { TimelineRestaurant } from "@/lib/types";

interface TimelineNodeProps {
  restaurant: TimelineRestaurant;
  index: number;
}

export function TimelineNode({ restaurant, index }: TimelineNodeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.9, 1, 1, 0.9]);

  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      className="relative flex min-h-[60vh] items-center py-12 md:py-20"
      style={{ opacity }}
    >
      <div
        className={`mx-auto grid w-full max-w-6xl items-center gap-8 px-6 md:grid-cols-2 md:gap-16 ${
          isEven ? "" : "md:[direction:rtl]"
        }`}
      >
        {/* Image */}
        <motion.div style={{ y, scale }} className="md:[direction:ltr]">
          <Link
            href={`/restaurant/${restaurant.slug.current}`}
            className="group block overflow-hidden rounded-2xl"
            data-cursor="magnetic"
          >
            {restaurant.heroImage && (
              <motion.div
                className="relative aspect-[4/3] overflow-hidden rounded-2xl"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.4 }}
              >
                <Image
                  src={urlFor(restaurant.heroImage).width(800).quality(80).url()}
                  alt={restaurant.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </motion.div>
            )}
          </Link>
        </motion.div>

        {/* Info */}
        <motion.div
          className="space-y-4 md:[direction:ltr]"
          style={{ y: useTransform(scrollYProgress, [0, 1], [40, -40]) }}
        >
          {/* Date */}
          <p className="text-xs uppercase tracking-widest text-muted">
            {new Date(restaurant.dateVisited).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            })}
          </p>

          {/* Name */}
          <Link href={`/restaurant/${restaurant.slug.current}`}>
            <h2 className="font-serif text-3xl font-bold leading-tight transition-colors hover:text-accent md:text-5xl">
              {restaurant.name}
            </h2>
          </Link>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted">
            <span>{restaurant.cuisine}</span>
            <span className="text-foreground/20">|</span>
            <span>{restaurant.priceRange}</span>
            {restaurant.overallScore && (
              <>
                <span className="text-foreground/20">|</span>
                <span className="font-serif font-semibold text-foreground">
                  {restaurant.overallScore.toFixed(1)}
                </span>
              </>
            )}
          </div>

          {/* Summary */}
          <p className="max-w-md leading-relaxed text-muted">
            {restaurant.summary}
          </p>

          {/* CTA */}
          <Link
            href={`/restaurant/${restaurant.slug.current}`}
            className="inline-block text-sm uppercase tracking-widest text-foreground/60 transition-colors hover:text-foreground"
          >
            Read Review →
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
