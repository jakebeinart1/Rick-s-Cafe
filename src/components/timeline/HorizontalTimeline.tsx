"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TimelinePanel } from "./TimelinePanel";
import { ProgressBar } from "@/components/effects/ProgressBar";
import type { TimelineRestaurant } from "@/lib/types";

gsap.registerPlugin(ScrollTrigger);

// Houston food scene Unsplash photos
const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
  "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80",
  "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
];

interface Props {
  restaurants: TimelineRestaurant[];
}

export function HorizontalTimeline({ restaurants }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const totalScroll = track.scrollWidth - window.innerWidth;

    const tween = gsap.to(track, {
      x: -totalScroll,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        pin: true,
        scrub: 1,
        end: () => `+=${totalScroll}`,
        onUpdate: (self) => setProgress(self.progress),
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [restaurants, isMobile]);

  return (
    <>
      {isMobile ? (
        <div className="divide-y divide-foreground/5 px-4 py-12">
          {restaurants.map((restaurant, i) => (
            <div key={restaurant._id} className="py-8 first:pt-0 last:pb-0">
              <TimelinePanel
                restaurant={restaurant}
                index={i}
                imageUrl={MOCK_IMAGES[i % MOCK_IMAGES.length]}
              />
            </div>
          ))}
        </div>
      ) : (
        <div ref={containerRef} className="relative overflow-hidden">
          {/* Horizontal timeline line */}
          <div className="absolute top-1/2 left-0 z-20 h-px w-full -translate-y-1/2 bg-foreground/10" />

          <div
            ref={trackRef}
            className="flex"
            style={{ willChange: "transform" }}
          >
            {restaurants.map((restaurant, i) => (
              <TimelinePanel
                key={restaurant._id}
                restaurant={restaurant}
                index={i}
                imageUrl={MOCK_IMAGES[i % MOCK_IMAGES.length]}
              />
            ))}

            {/* End spacer */}
            <div className="flex h-screen w-[50vw] flex-shrink-0 items-center justify-center">
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">
                  The journey continues
                </p>
                <p className="mt-4 font-mono text-3xl font-bold text-foreground/30">
                  ...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProgressBar progress={progress} />
    </>
  );
}
