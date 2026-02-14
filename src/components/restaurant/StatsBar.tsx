"use client";

import { motion } from "framer-motion";
import { MapPin, DollarSign, Utensils } from "lucide-react";

interface StatsBarProps {
  overallScore: number;
  priceRange: string;
  cuisine: string;
  location: { city: string; state: string };
}

export function StatsBar({ overallScore, priceRange, cuisine, location }: StatsBarProps) {
  return (
    <motion.div
      className="sticky top-0 z-40 border-b border-foreground/5 bg-background/80 backdrop-blur-xl md:top-20"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-muted" />
            <span>
              {location.city}, {location.state}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Utensils size={14} className="text-muted" />
            <span>{cuisine}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign size={14} className="text-muted" />
            <span>{priceRange}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-muted">Score</span>
          <span className="font-serif text-xl font-bold">{overallScore.toFixed(1)}</span>
        </div>
      </div>
    </motion.div>
  );
}
