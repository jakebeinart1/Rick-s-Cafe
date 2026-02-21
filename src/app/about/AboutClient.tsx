"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { PageTransition } from "@/components/layout/PageTransition";
import type { SiteSettings } from "@/lib/types";

// Fallback content when Sanity is not connected
const fallbackTimeline = [
  {
    year: "2018",
    title: "The Fundraiser",
    description:
      "It started with tiki torches, a Hawaiian shirt dress code, and a high school gym transformed into a tropical paradise. The goal was simple: raise money, feed people, bring them together.",
  },
  {
    year: "2020",
    title: "The Notebook",
    description:
      "A small Moleskine notebook started collecting scribbled scores, hastily written flavor notes, and ratings for every restaurant visit. The system was born — Taste, Vibe, Service, Value.",
  },
  {
    year: "2022",
    title: "The Name",
    description:
      'The fundraiser spirit needed a name. "Rick\'s Cafe" — warm, inviting, a place where everyone belongs. Part Casablanca, part that Hawaiian night, all heart.',
  },
  {
    year: "2024",
    title: "The Digital World",
    description:
      "The notebook became a blog. The scribbles became reviews. The spirit stayed the same: meticulous, fun, and deeply atmospheric. Welcome to Rick's Cafe.",
  },
];

function RevealText({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface Props {
  settings: SiteSettings | null;
}

export function AboutClient({ settings }: Props) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  const timelineEvents = settings?.timelineEvents ?? fallbackTimeline;

  return (
    <PageTransition>
      {/* Hero Section */}
      <div
        ref={heroRef}
        className="relative flex h-screen items-center justify-center overflow-hidden"
      >
        <motion.div
          className="relative z-10 max-w-3xl px-6 text-center"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          <motion.p
            className="mb-6 text-xs uppercase tracking-[0.3em] text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            The Story
          </motion.p>
          <motion.h1
            className="font-heading text-5xl font-bold leading-tight md:text-7xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            From Tiki Torches
            <br />
            to the Table
          </motion.h1>
        </motion.div>
      </div>

      {/* Origin Story */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <RevealText>
          <p className="font-heading text-2xl leading-relaxed text-muted md:text-3xl">
            Rick&apos;s Caf&eacute; started as a Hawaiian-themed fundraiser. Tiki
            torches, school community, and a vibe of bringing people together
            over food.
          </p>
        </RevealText>

        <RevealText delay={0.2}>
          <p className="mt-8 text-lg leading-relaxed text-muted">
            This blog is the digital evolution of that spirit — meticulous, fun,
            and deeply atmospheric. Every review is a chapter. Every score tells
            a story. Every photo captures a moment worth savoring.
          </p>
        </RevealText>
      </section>

      {/* Timeline of the Name */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <RevealText>
          <h2 className="mb-16 text-center font-heading text-3xl font-bold md:text-5xl">
            Timeline of the Name
          </h2>
        </RevealText>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 h-full w-px bg-foreground/10 md:left-1/2 md:-translate-x-px" />

          {timelineEvents.map((event, i) => (
            <motion.div
              key={event.year}
              className={`relative mb-16 flex items-start gap-8 ${
                i % 2 === 0
                  ? "md:flex-row"
                  : "md:flex-row-reverse md:text-right"
              }`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
            >
              {/* Year dot */}
              <div className="absolute left-8 flex -translate-x-1/2 items-center justify-center md:left-1/2">
                <div className="h-2 w-2 bg-accent" />
              </div>

              {/* Content */}
              <div className="ml-16 md:ml-0 md:w-[calc(50%-2rem)]">
                <span className="font-mono text-4xl font-bold tracking-tight text-accent">
                  {event.year}
                </span>
                <h3 className="mt-2 text-xl font-semibold">{event.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">
                  {event.description}
                </p>
              </div>

              {/* Spacer for the other side */}
              <div className="hidden md:block md:w-[calc(50%-2rem)]" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="py-32 text-center">
        <RevealText>
          <p className="mx-auto max-w-lg font-heading text-2xl leading-relaxed">
            Every meal tells a story.
            <br />
            This is where we write them down.
          </p>
        </RevealText>
      </section>
    </PageTransition>
  );
}
