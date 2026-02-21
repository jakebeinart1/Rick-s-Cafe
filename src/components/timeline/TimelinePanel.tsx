"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TextScramble } from "@/components/effects/TextScramble";
import type { TimelineRestaurant } from "@/lib/types";

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
    <span ref={ref} className="font-mono text-4xl font-bold text-accent">
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
      <div className="relative z-10 grid h-full w-full grid-cols-1 items-center gap-8 py-20 md:grid-cols-2 md:gap-16">
        {/* Image with clip-path reveal */}
        <Link
          href={`/restaurant/${restaurant.slug.current}`}
          className="group relative block overflow-hidden rounded-sm"
          data-cursor="magnetic"
        >
          <div
            className="relative aspect-[3/4] overflow-hidden rounded-sm transition-all duration-[1.2s] ease-out md:aspect-[4/5]"
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
              className="object-cover transition-all duration-700 group-hover:scale-105 group-hover:saturate-100"
              style={{ filter: "saturate(0.85)" }}
              sizes="(max-width: 768px) 80vw, 40vw"
            />
          </div>
        </Link>

        {/* Text content */}
        <div
          className="flex flex-col justify-center space-y-5 transition-all duration-700 ease-out"
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? "translateX(0)" : "translateX(40px)",
          }}
        >
          {/* Index number */}
          <span className="font-mono text-xs text-foreground/30">{String(index + 1).padStart(2, '0')}</span>

          {/* Date */}
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent-gold">
            {new Date(restaurant.dateVisited).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long" }
            )}
          </p>

          {/* Restaurant name with scramble effect */}
          <TextScramble
            text={restaurant.name}
            as="h2"
            className="font-heading text-4xl font-bold leading-tight md:text-6xl"
            delay={300}
          />

          {/* Meta */}
          <div className="flex items-center gap-4 font-mono text-sm text-muted">
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
            className="text-sm uppercase tracking-widest text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent transition-colors hover:text-accent-gold"
          >
            Read Review
          </Link>
        </div>
      </div>
    </div>
  );
}
