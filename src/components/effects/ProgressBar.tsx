"use client";

import { motion } from "framer-motion";

interface Props {
  progress: number; // 0 to 1
}

export function ProgressBar({ progress }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-[2px] bg-foreground/5">
      <motion.div
        className="h-full origin-left bg-accent"
        style={{ scaleX: progress }}
      />
    </div>
  );
}
