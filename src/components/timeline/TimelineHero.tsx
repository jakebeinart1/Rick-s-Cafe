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
      {/* Background food image with warm tint */}
      <motion.div
        className="absolute inset-0"
        style={{ scale: bgScale }}
      >
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80)",
            opacity: 0.12,
            filter: "sepia(30%) saturate(120%)",
          }}
        />
      </motion.div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, var(--background) 80%)",
        }}
      />

      {/* Gradient fade to bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background:
            "linear-gradient(to top, var(--background), transparent)",
        }}
      />

      <motion.div
        className="relative z-10 text-center"
        style={{ y: titleY, opacity: titleOpacity }}
      >
        <motion.p
          className="mb-6 text-xs uppercase tracking-[0.4em] text-accent-gold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          A Houston Food Journey
        </motion.p>

        <motion.h1
          className="font-serif text-[15vw] font-bold leading-[0.85] tracking-tight md:text-[12vw]"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.5,
            duration: 1,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span className="block">Rick&apos;s</span>
          <span className="block text-accent">Caf&eacute;</span>
        </motion.h1>

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
          className="mt-16 flex items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <span className="text-xs uppercase tracking-widest text-muted">
            Scroll
          </span>
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              ease: "easeInOut",
            }}
          >
            <svg
              width="24"
              height="12"
              viewBox="0 0 24 12"
              fill="none"
              className="text-accent"
            >
              <path
                d="M0 6h20m0 0l-5-5m5 5l-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
