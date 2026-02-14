"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TextScramble } from "@/components/effects/TextScramble";
import type { TimelineRestaurant } from "@/lib/types";

const GRADIENT_COLORS = [
  "radial-gradient(circle at 30% 50%, rgba(224,122,58,0.15), transparent 60%)",
  "radial-gradient(circle at 70% 40%, rgba(196,69,54,0.15), transparent 60%)",
  "radial-gradient(circle at 40% 60%, rgba(42,157,143,0.12), transparent 60%)",
  "radial-gradient(circle at 60% 30%, rgba(212,168,83,0.15), transparent 60%)",
  "radial-gradient(circle at 50% 70%, rgba(224,122,58,0.12), transparent 60%)",
  "radial-gradient(circle at 30% 40%, rgba(196,69,54,0.12), transparent 60%)",
];

interface Props {
  restaurant: TimelineRestaurant;
  index: number;
  imageUrl: string;
}

function ScoreCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 800;
          const start = performance.now();

          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(parseFloat((eased * value).toFixed(1)));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="font-serif text-4xl font-bold text-accent">
      {display.toFixed(1)}
    </span>
  );
}

export function TimelinePanel({ restaurant, index, imageUrl }: Props) {
  const [revealed, setRevealed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRevealed(true);
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={panelRef}
      className="relative flex min-h-screen w-full flex-shrink-0 items-center px-4 md:h-screen md:w-[80vw] md:px-16"
    >
      {/* Layer 1: Background gradient blob */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: GRADIENT_COLORS[index % GRADIENT_COLORS.length],
          opacity: revealed ? 1 : 0,
        }}
      />

      <div className="relative z-10 grid h-full w-full grid-cols-1 items-center gap-8 py-20 md:grid-cols-2 md:gap-16">
        {/* Layer 2: Image with clip-path reveal */}
        <Link
          href={`/restaurant/${restaurant.slug.current}`}
          className="group relative block overflow-hidden rounded-2xl"
          data-cursor="magnetic"
        >
          <div
            className="relative aspect-[3/4] overflow-hidden rounded-2xl transition-all duration-[1.2s] ease-out md:aspect-[4/5]"
            style={{
              clipPath: revealed
                ? "inset(0% 0% 0% 0%)"
                : "inset(0% 100% 0% 0%)",
            }}
          >
            <Image
              src={imageUrl}
              alt={restaurant.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 80vw, 40vw"
            />
            {/* Warm tint overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </div>
        </Link>

        {/* Layer 3: Text content */}
        <div
          className="flex flex-col justify-center space-y-5 transition-all duration-700 ease-out"
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed
              ? "translateX(0)"
              : "translateX(40px)",
          }}
        >
          {/* Date */}
          <p className="text-xs uppercase tracking-[0.3em] text-accent-gold">
            {new Date(restaurant.dateVisited).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long" }
            )}
          </p>

          {/* Restaurant name with scramble effect */}
          <TextScramble
            text={restaurant.name}
            as="h2"
            className="font-serif text-4xl font-bold leading-tight md:text-6xl"
            delay={300}
          />

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted">
            <span>{restaurant.cuisine}</span>
            <span className="text-foreground/20">|</span>
            <span>{restaurant.priceRange}</span>
          </div>

          {/* Score */}
          {restaurant.overallScore && (
            <div className="flex items-baseline gap-3">
              <ScoreCounter value={restaurant.overallScore} />
              <span className="text-xs uppercase tracking-widest text-muted">
                / 10
              </span>
            </div>
          )}

          {/* Summary */}
          <p className="max-w-md leading-relaxed text-muted">
            {restaurant.summary}
          </p>

          {/* CTA */}
          <Link
            href={`/restaurant/${restaurant.slug.current}`}
            className="group/cta inline-flex items-center gap-2 text-sm uppercase tracking-widest text-accent transition-colors hover:text-accent-gold"
          >
            Read Review
            <svg
              width="16"
              height="8"
              viewBox="0 0 16 8"
              fill="none"
              className="transition-transform group-hover/cta:translate-x-1"
            >
              <path
                d="M0 4h12m0 0L9 1m3 3L9 7"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
