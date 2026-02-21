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
      {/* Background food image */}
      <motion.div
        className="absolute inset-0"
        style={{ scale: bgScale }}
      >
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80)",
            opacity: 0.06,
          }}
        />
      </motion.div>

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

        <hr className="mx-auto mt-8 w-16 border-foreground/20" />

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
