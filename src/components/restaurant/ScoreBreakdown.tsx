"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoreBreakdownProps {
  scores: {
    taste: number;
    vibe: number;
    service: number;
    value: number;
  };
  rickFactor: {
    score: number;
    description: string;
  };
}

const categories = [
  { key: "taste", label: "Taste" },
  { key: "vibe", label: "Vibe" },
  { key: "service", label: "Service" },
  { key: "value", label: "Value" },
] as const;

function ScoreBar({ label, score, delay }: { label: string; score: number; delay: number }) {
  const percentage = (score / 10) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">{label}</span>
        <span className="font-mono text-sm font-semibold">{score}</span>
      </div>
      <div className="h-0.5 w-full overflow-hidden rounded-none bg-foreground/5">
        <motion.div
          className="h-full rounded-none bg-foreground"
          initial={{ width: 0 }}
          whileInView={{ width: `${percentage}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export function ScoreBreakdown({ scores, rickFactor }: ScoreBreakdownProps) {
  const overall = (scores.taste + scores.vibe + scores.service + scores.value) / 4;

  return (
    <div className="space-y-8">
      {/* Overall score */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <span className="font-mono text-5xl font-bold">{overall.toFixed(1)}</span>
        </motion.div>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted">Overall</p>
      </div>

      {/* Individual scores */}
      <div className="space-y-4">
        {categories.map((cat, i) => (
          <ScoreBar
            key={cat.key}
            label={cat.label}
            score={scores[cat.key]}
            delay={i * 0.1}
          />
        ))}
      </div>

      {/* The Rick Factor */}
      <motion.div
        className={cn(
          "border-l-2 border-accent pl-6 py-4",
          "space-y-3"
        )}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-accent">
            The Rick Factor
          </span>
          <span className="font-mono text-2xl font-bold text-accent">
            {rickFactor.score}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted">
          {rickFactor.description}
        </p>
      </motion.div>
    </div>
  );
}
