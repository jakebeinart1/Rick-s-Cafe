"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function TimelineHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const titleY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  return (
    <div
      ref={ref}
      className="relative flex h-screen items-center justify-center overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      {/* Houston sunset sky — hand-crafted gradient, no image required */}
      <motion.div
        className="absolute inset-0"
        style={{ scale: bgScale }}
      >
        <div
          className="h-full w-full"
          style={{
            background: `
              radial-gradient(ellipse 220% 38% at 50% 87%, rgba(232,137,42,0.40) 0%, rgba(212,96,26,0.28) 28%, rgba(140,95,168,0.10) 58%, transparent 75%),
              linear-gradient(
                to bottom,
                #1a2240 0%,
                #1f1a3a 12%,
                #2e1848 24%,
                #4a1e40 36%,
                #6b2a30 48%,
                #8b3a20 58%,
                #c4621a 68%,
                #e8892a 76%,
                #d4a030 83%,
                #8a5210 90%,
                #1a1208 97%,
                #0d0d08 100%
              )
            `,
          }}
        />
      </motion.div>

      {/* Amber horizon glow — the sun just below the skyline */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 85% 35% at 50% 100%, rgba(232,137,42,0.10) 0%, transparent 65%)",
        }}
      />

      {/* Fade into page background at bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: "linear-gradient(to top, var(--background), transparent)",
        }}
      />

      <motion.div
        className="relative z-10 text-center"
        style={{ y: titleY, opacity: titleOpacity }}
      >
        <motion.p
          className="mb-6 font-mono text-xs uppercase tracking-[0.4em] text-muted"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          A Houston Food Journey
        </motion.p>

        <motion.h1
          className="font-heading text-[15vw] font-bold leading-[0.85] tracking-tighter md:text-[12vw]"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.5,
            duration: 1,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span className="block text-foreground">Rick&apos;s</span>
          <span className="block text-foreground">Caf&eacute;</span>
        </motion.h1>

        <hr className="mx-auto mt-8 w-16 border-accent-gold/50" />

        <p className="font-mono text-xs text-muted mt-4">Houston, TX — Est. 2018</p>

        <motion.p
          className="mx-auto mt-8 max-w-sm text-sm leading-relaxed text-muted md:max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          Meticulous reviews documenting every bite, every vibe,
          every moment worth remembering.
        </motion.p>

        {/* Horizontal scroll indicator */}
        <motion.div
          className="mt-16 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <span className="font-mono text-xs text-muted">scroll &rarr;</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
