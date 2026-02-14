# Houston After Dark — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the vertical timeline homepage with a cinematic horizontal-scrolling gallery featuring layered visual effects, warm saturated colors, and Houston food photography.

**Architecture:** GSAP ScrollTrigger pins the timeline section and maps vertical scroll to horizontal translation. Each restaurant is rendered as a ~80vw panel with 3 depth layers (gradient, parallax photo, text). Visual effects (film grain, particles, vignette) are layered as fixed-position overlays. Mobile falls back to vertical scroll.

**Tech Stack:** Next.js 16 (App Router), GSAP + ScrollTrigger, Framer Motion, Tailwind CSS 4, Canvas 2D API, Unsplash images via next/image.

---

### Task 1: Update Color Palette and Global Styles

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `next.config.ts`

**Step 1: Update globals.css with new dark palette and texture utilities**

Replace the entire `:root` and dark mode sections. Add film grain CSS, vignette utility, and new Tailwind theme tokens.

```css
@import "tailwindcss";

:root {
  --background: #1a1410;
  --background-secondary: #2a1f18;
  --foreground: #f0e6d3;
  --accent: #e07a3a;
  --accent-red: #c44536;
  --accent-teal: #2a9d8f;
  --accent-gold: #d4a853;
  --muted: #8a7e72;
}

@theme inline {
  --color-background: var(--background);
  --color-background-secondary: var(--background-secondary);
  --color-foreground: var(--foreground);
  --color-accent: var(--accent);
  --color-accent-red: var(--accent-red);
  --color-accent-teal: var(--accent-teal);
  --color-accent-gold: var(--accent-gold);
  --color-muted: var(--muted);
  --font-sans: var(--font-sans-var);
  --font-serif: var(--font-serif-var);
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans-var), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--foreground); opacity: 0.2; border-radius: 3px; }

::selection { background: var(--accent); color: var(--background); }

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
}
```

**Step 2: Update layout.tsx theme color**

Change the viewport `themeColor` from `"#faf9f6"` to `"#1a1410"`.

**Step 3: Add images.unsplash.com to next.config.ts remotePatterns**

Add a new entry: `{ protocol: "https", hostname: "images.unsplash.com" }`.

**Step 4: Verify the site loads with the new dark palette**

Open the dev server and confirm the background is dark warm black, text is warm cream, and no elements are invisible/broken.

**Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx next.config.ts
git commit -m "style: update color palette to Houston After Dark dark theme"
```

---

### Task 2: Create Film Grain Effect Component

**Files:**
- Create: `src/components/effects/FilmGrain.tsx`

**Step 1: Create the FilmGrain component**

Uses a CSS SVG filter for noise. Fixed position overlay covering the viewport, pointer-events-none.

```tsx
"use client";

export function FilmGrain() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{ opacity: 0.04 }}
    >
      <svg className="hidden">
        <filter id="film-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div
        className="h-full w-full"
        style={{
          filter: "url(#film-grain)",
          transform: "scale(1.5)",
        }}
      />
    </div>
  );
}
```

**Step 2: Verify film grain renders**

Import `<FilmGrain />` in `layout.tsx` temporarily to confirm it displays a subtle noise overlay. Then remove it (it will be properly placed in Task 6).

**Step 3: Commit**

```bash
git add src/components/effects/FilmGrain.tsx
git commit -m "feat: add film grain overlay effect component"
```

---

### Task 3: Create Particle Field Effect Component

**Files:**
- Create: `src/components/effects/ParticleField.tsx`

**Step 1: Create the ParticleField component**

Canvas-based particle system. ~30 warm-toned circles that float gently. Fixed position, pointer-events-none.

```tsx
"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

const COLORS = ["#e07a3a", "#d4a853", "#c44536", "#f0e6d3"];

export function ParticleField({ count = 30 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Init particles
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3 - 0.1,
      radius: Math.random() * 2 + 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[99]"
    />
  );
}
```

**Step 2: Commit**

```bash
git add src/components/effects/ParticleField.tsx
git commit -m "feat: add floating particle field canvas effect"
```

---

### Task 4: Create Text Scramble Effect Component

**Files:**
- Create: `src/components/effects/TextScramble.tsx`

**Step 1: Create the TextScramble component**

Scrambles through random characters before resolving to final text. Triggered when element enters viewport via IntersectionObserver.

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";

interface Props {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
}

export function TextScramble({ text, className = "", as: Tag = "span", delay = 0 }: Props) {
  const [displayText, setDisplayText] = useState(text);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered) {
          setHasTriggered(true);
          setTimeout(() => scramble(), delay);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasTriggered, delay]);

  function scramble() {
    const duration = 600;
    const steps = 15;
    const stepTime = duration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = step / steps;

      const result = text
        .split("")
        .map((char, i) => {
          if (char === " ") return " ";
          if (i / text.length < progress) return char;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");

      setDisplayText(result);

      if (step >= steps) {
        clearInterval(interval);
        setDisplayText(text);
      }
    }, stepTime);
  }

  return (
    <Tag ref={ref as any} className={className}>
      {displayText}
    </Tag>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/effects/TextScramble.tsx
git commit -m "feat: add text scramble reveal effect component"
```

---

### Task 5: Create Progress Bar Component

**Files:**
- Create: `src/components/effects/ProgressBar.tsx`

**Step 1: Create the ProgressBar component**

A thin horizontal bar fixed to the bottom of the viewport. Its width is driven by a progress value (0-1) passed as a prop.

```tsx
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
```

**Step 2: Commit**

```bash
git add src/components/effects/ProgressBar.tsx
git commit -m "feat: add scroll progress bar component"
```

---

### Task 6: Build the Horizontal Timeline and Redesigned Hero

This is the main task. Build the GSAP-powered horizontal scroll timeline and the new hero section.

**Files:**
- Create: `src/components/timeline/HorizontalTimeline.tsx`
- Create: `src/components/timeline/TimelinePanel.tsx`
- Modify: `src/app/HomeClient.tsx`
- Modify: `src/components/timeline/TimelineHero.tsx`

**Step 1: Rewrite TimelineHero.tsx with the new dark cinematic design**

Full-viewport hero with massive typography, right-pointing scroll indicator, background food image at low opacity, and vignette.

```tsx
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
```

**Step 2: Create TimelinePanel.tsx**

Individual restaurant panel with 3 depth layers, clip-path reveal on the image, score counter animation.

```tsx
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
      className="relative flex h-screen w-[80vw] flex-shrink-0 items-center px-8 md:px-16"
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
```

**Step 3: Create HorizontalTimeline.tsx**

The GSAP ScrollTrigger container that pins the viewport and translates panels horizontally as the user scrolls vertically.

```tsx
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
  "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80", // BBQ brisket
  "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80", // Tacos
  "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80", // Pho
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80", // Seafood
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", // Fine dining
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80", // Plated food
];

interface Props {
  restaurants: TimelineRestaurant[];
}

export function HorizontalTimeline({ restaurants }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    // Calculate total horizontal scroll distance
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
  }, [restaurants]);

  return (
    <>
      <div ref={containerRef} className="relative overflow-hidden">
        {/* Horizontal timeline line */}
        <div className="absolute top-1/2 left-0 z-20 h-px w-full -translate-y-1/2 bg-foreground/5" />

        {/* Date markers on the line */}
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
              <p className="mt-4 font-serif text-3xl font-bold text-accent">
                ...
              </p>
            </div>
          </div>
        </div>
      </div>

      <ProgressBar progress={progress} />
    </>
  );
}
```

**Step 4: Rewrite HomeClient.tsx to use new components**

Replace the old Timeline + TimelineHero with new HorizontalTimeline + redesigned hero + effects.

```tsx
"use client";

import { PageTransition } from "@/components/layout/PageTransition";
import { TimelineHero } from "@/components/timeline/TimelineHero";
import { HorizontalTimeline } from "@/components/timeline/HorizontalTimeline";
import { FilmGrain } from "@/components/effects/FilmGrain";
import { ParticleField } from "@/components/effects/ParticleField";
import type { TimelineRestaurant } from "@/lib/types";

const mockRestaurants: TimelineRestaurant[] = [
  {
    _id: "houston-1",
    name: "Truth BBQ",
    slug: { current: "truth-bbq" },
    cuisine: "Texas BBQ",
    priceRange: "$$",
    heroImage: null as any,
    overallScore: 9.4,
    dateVisited: "2025-12-15",
    summary:
      "Brisket so tender it surrenders on contact. The burnt ends are obsidian jewels of smoky perfection. Worth every minute in line.",
  },
  {
    _id: "houston-2",
    name: "Xochi",
    slug: { current: "xochi" },
    cuisine: "Oaxacan Mexican",
    priceRange: "$$$",
    heroImage: null as any,
    overallScore: 9.1,
    dateVisited: "2025-11-28",
    summary:
      "Mole negro that tastes like it took a village to make. The chocolate tamale dessert is an emotional experience disguised as food.",
  },
  {
    _id: "houston-3",
    name: "Crawfish & Noodles",
    slug: { current: "crawfish-and-noodles" },
    cuisine: "Viet-Cajun",
    priceRange: "$$",
    heroImage: null as any,
    overallScore: 8.8,
    dateVisited: "2025-10-10",
    summary:
      "Where garlic butter meets lemongrass in a muddy, beautiful marriage. Houston in a single bite. Plastic bibs mandatory.",
  },
  {
    _id: "houston-4",
    name: "March",
    slug: { current: "march" },
    cuisine: "Contemporary American",
    priceRange: "$$$$",
    heroImage: null as any,
    overallScore: 9.3,
    dateVisited: "2025-09-05",
    summary:
      "A tasting menu that reads like poetry and tastes like a fever dream. Every course is a thesis statement on Houston's diversity.",
  },
  {
    _id: "houston-5",
    name: "Himalaya",
    slug: { current: "himalaya" },
    cuisine: "Pakistani-Indian",
    priceRange: "$$",
    heroImage: null as any,
    overallScore: 9.0,
    dateVisited: "2025-08-22",
    summary:
      "The fried goat is legendary for a reason. Biryani that could broker peace treaties. A strip-mall cathedral of spice.",
  },
  {
    _id: "houston-6",
    name: "Le Jardinier",
    slug: { current: "le-jardinier" },
    cuisine: "French Vegetable-Forward",
    priceRange: "$$$$",
    heroImage: null as any,
    overallScore: 8.6,
    dateVisited: "2025-07-14",
    summary:
      "Proof that vegetables can be the main character. Every plate is a still life that happens to be edible. The wine list whispers to you.",
  },
];

interface Props {
  restaurants: TimelineRestaurant[];
}

export function HomeClient({ restaurants }: Props) {
  const data = restaurants.length > 0 ? restaurants : mockRestaurants;

  return (
    <PageTransition>
      <FilmGrain />
      <ParticleField count={25} />
      <TimelineHero />
      <HorizontalTimeline restaurants={data} />

      {/* Footer CTA section */}
      <section className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">
          Hungry for more?
        </p>
        <h2 className="mt-4 font-serif text-4xl font-bold md:text-6xl">
          Explore the Full
          <br />
          <span className="text-accent">Journey</span>
        </h2>
        <a
          href="/about"
          className="mt-8 inline-block border border-accent/30 px-8 py-3 text-xs uppercase tracking-widest text-accent transition-all hover:border-accent hover:bg-accent/10"
        >
          About Rick&apos;s Caf&eacute;
        </a>
      </section>
    </PageTransition>
  );
}
```

**Step 5: Verify on dev server**

- Hero section renders with massive dark typography and warm accent color
- Scrolling down pins the horizontal timeline and scrolls panels left
- Each panel reveals with clip-path animation and text scramble
- Film grain and particles are visible as overlays
- Progress bar fills at bottom as you scroll
- Mobile: verify it doesn't break (detailed mobile tuning is Task 7)

**Step 6: Commit**

```bash
git add src/components/timeline/TimelineHero.tsx src/components/timeline/TimelinePanel.tsx src/components/timeline/HorizontalTimeline.tsx src/app/HomeClient.tsx
git commit -m "feat: implement horizontal scroll timeline with cinematic effects"
```

---

### Task 7: Navigation and Layout Adjustments

**Files:**
- Modify: `src/components/layout/Navigation.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Update Navigation colors for dark theme**

The Navigation uses `bg-background` and `text-foreground` which should adapt automatically. But update the mobile nav border and blur to match the dark theme.

In `Navigation.tsx`, change the mobile nav border from `border-foreground/5` to `border-foreground/10` and the bg from `bg-background/80` to `bg-background/90`.

**Step 2: Update layout.tsx to remove main padding on homepage**

The horizontal scroll works best when the main content area doesn't have top padding fighting with the hero. Keep the padding for non-home pages. Since this is a global layout, the current padding (`pb-20 md:pb-0 md:pt-24`) may cause issues with the pinned scroll. Update the main element to remove top padding (the hero handles its own spacing). Change `md:pt-24` to `md:pt-0` and let individual pages handle their own top spacing.

Actually, since the nav is fixed/absolute, pages need their own spacing. Keep the mobile bottom padding for the bottom nav. For the homepage, the hero is full-screen so it handles itself. For other pages (restaurant detail, about), they already handle their own top spacing with full-height heroes. Remove `md:pt-24` from the main tag.

**Step 3: Commit**

```bash
git add src/components/layout/Navigation.tsx src/app/layout.tsx
git commit -m "style: adjust navigation and layout for dark theme"
```

---

### Task 8: Mobile Responsiveness Pass

**Files:**
- Modify: `src/components/timeline/HorizontalTimeline.tsx`
- Modify: `src/components/timeline/TimelinePanel.tsx`
- Modify: `src/components/effects/ParticleField.tsx`

**Step 1: Add mobile fallback to HorizontalTimeline**

On screens smaller than `md` (768px), disable GSAP horizontal scroll and render panels in a vertical stack instead. Use a `useMediaQuery` check. Inside the component, conditionally render either the GSAP horizontal scroll or a vertical list.

For mobile, render each panel as a vertically-stacked card (no GSAP pin). Keep the clip-path reveals and text scramble. Reduce particle count to 12.

**Step 2: Adjust TimelinePanel for mobile**

On mobile, the panel should be `w-full` instead of `w-[80vw]` and `h-auto min-h-screen` instead of `h-screen`. The grid should be single-column. Image aspect ratio should be `aspect-[4/3]` on mobile.

**Step 3: Verify on mobile viewport**

Use browser dev tools to check 375px and 390px widths. Panels should stack vertically with smooth reveals. No horizontal overflow or broken layouts.

**Step 4: Commit**

```bash
git add src/components/timeline/HorizontalTimeline.tsx src/components/timeline/TimelinePanel.tsx src/components/effects/ParticleField.tsx
git commit -m "fix: add mobile responsive fallback for horizontal timeline"
```

---

### Task 9: Final Polish and Visual Refinements

**Files:**
- Various components as needed

**Step 1: Add hover effects to timeline panels**

On desktop, add subtle scale and brightness changes when hovering over a panel's image. The image should lift slightly and the gradient blob should intensify.

**Step 2: Ensure custom cursor works with new elements**

The existing `CustomCursor` component checks for `data-cursor="magnetic"` attributes. Make sure the new CTA links and images have this attribute.

**Step 3: Check reduced motion support**

The `useReducedMotion` hook exists. Ensure GSAP animations respect it: if reduced motion is preferred, disable the horizontal scroll pin and use simple vertical layout. Disable particles and grain.

**Step 4: Full visual review on dev server**

Walk through the entire homepage flow:
1. Hero loads with animation
2. Scroll indicator points right
3. Scrolling triggers horizontal timeline
4. Each panel reveals cleanly
5. Text scrambles resolve
6. Scores count up
7. Film grain and particles visible but not distracting
8. Progress bar tracks scroll
9. Footer CTA appears after timeline
10. Navigation remains functional

**Step 5: Commit**

```bash
git add -A
git commit -m "polish: refine hover effects, cursor integration, and reduced motion support"
```
