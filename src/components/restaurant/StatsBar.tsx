"use client";

import { motion } from "framer-motion";

interface StatsBarProps {
  overallScore: number;
  priceRange: string;
  cuisine: string;
  location: { city: string; state: string };
}

export function StatsBar({ overallScore, priceRange, cuisine, location }: StatsBarProps) {
  return (
    <motion.div
      className="sticky top-0 z-40 border-b border-foreground/5 bg-background/90 backdrop-blur-sm md:top-20"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-0 font-mono text-sm">
          <span className="font-mono">
            {location.city}, {location.state}
          </span>
          <span className="mx-2 text-muted">&middot;</span>
          <span className="font-mono">{cuisine}</span>
          <span className="mx-2 text-muted">&middot;</span>
          <span className="font-mono">{priceRange}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">Score</span>
          <span className="font-mono text-xl font-bold">{overallScore.toFixed(1)}</span>
        </div>
      </div>
    </motion.div>
  );
}
