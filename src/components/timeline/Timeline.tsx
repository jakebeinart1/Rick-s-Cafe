"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { TimelineNode } from "./TimelineNode";
import type { TimelineRestaurant } from "@/lib/types";

interface TimelineProps {
  restaurants: TimelineRestaurant[];
}

export function Timeline({ restaurants }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={containerRef} id="timeline" className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-foreground/5 md:block">
        <motion.div
          className="w-full bg-foreground/20"
          style={{ height: lineHeight }}
        />
      </div>

      {/* Timeline nodes */}
      <div className="space-y-4 md:space-y-0">
        {restaurants.map((restaurant, i) => (
          <TimelineNode key={restaurant._id} restaurant={restaurant} index={i} />
        ))}
      </div>
    </section>
  );
}
