# Framer Motion Skills -- Rick's Cafe

> Premium, immersive animation patterns for a high-end food blog.
> Design philosophy: heavy whitespace, smooth momentum scrolling, micro-interactions, and immersive transitions.
> Inspired by Graffico.it -- cinematic, editorial, sensory.

---

## Table of Contents

1. [Setup and Configuration](#1-setup-and-configuration)
2. [Page Transitions with AnimatePresence](#2-page-transitions-with-animatepresence)
3. [Scroll-Driven Animations](#3-scroll-driven-animations)
4. [Parallax Effects](#4-parallax-effects)
5. [Reveal-on-Scroll Text Animations](#5-reveal-on-scroll-text-animations)
6. [Micro-Interactions](#6-micro-interactions)
7. [Animation Variants and Orchestration](#7-animation-variants-and-orchestration)
8. [Momentum Scrolling and Snap-to-Section](#8-momentum-scrolling-and-snap-to-section)
9. [Performance Best Practices](#9-performance-best-practices)
10. [Accessibility](#10-accessibility)
11. [Spring Physics Reference](#11-spring-physics-reference)
12. [Common Pitfalls](#12-common-pitfalls)

---

## 1. Setup and Configuration

### Installation

```bash
# As of 2025-2026, the package is now "motion" (rebranded from framer-motion)
# Both package names work; "motion" is the forward-looking choice
npm install motion

# For momentum scrolling
npm install lenis
```

### Package Notes

- **framer-motion** v12.x is the latest (as of Feb 2026). The package has been rebranded to `motion` at motion.dev but `framer-motion` still works and points to the same code.
- Import from `"motion/react"` (new) or `"framer-motion"` (legacy, still supported).
- Bundle size: ~34kb with full `motion` component. Can be reduced to ~4.6kb with `m` + `LazyMotion`.

### Next.js App Router -- Critical Rules

Framer Motion relies on browser APIs (DOM, window, pointer events). In the App Router, **all pages and layouts are Server Components by default**. You must mark any file using Framer Motion with the `"use client"` directive.

**Pattern: Create client-side animation wrapper components, import them into Server Components.**

```tsx
// components/motion/FadeIn.tsx
"use client";

import { motion } from "framer-motion";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 80,
        damping: 20,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
```

```tsx
// app/page.tsx (Server Component -- no "use client" needed)
import { FadeIn } from "@/components/motion/FadeIn";

export default function HomePage() {
  return (
    <main>
      <FadeIn>
        <h1>Rick's Cafe</h1>
      </FadeIn>
    </main>
  );
}
```

### Bundle Size Optimization with LazyMotion

For production, use `LazyMotion` + the `m` component to reduce the Framer Motion footprint from ~34kb to ~4.6kb:

```tsx
// components/motion/MotionProvider.tsx
"use client";

import { LazyMotion, domAnimation } from "framer-motion";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
```

```tsx
// When using LazyMotion, import `m` instead of `motion`
"use client";

import { m } from "framer-motion";

export function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
    >
      {children}
    </m.div>
  );
}
```

Wrap your root layout with `MotionProvider`:

```tsx
// app/layout.tsx
import { MotionProvider } from "@/components/motion/MotionProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MotionProvider>
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
```

---

## 2. Page Transitions with AnimatePresence

### The Problem

Next.js App Router aggressively unmounts and remounts components during navigation, which breaks Framer Motion's `AnimatePresence` exit animations. The router context updates frequently, causing components to disappear before exit animations can play.

### Solution: FrozenRouter + LayoutTransition

This is the established workaround. It freezes the router context during exit animations so the outgoing page stays visible while animating out.

**WARNING:** This relies on internal Next.js APIs (`LayoutRouterContext`) which could break on Next.js updates. Pin your Next.js version and test after upgrades.

```tsx
// components/motion/LayoutTransition.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSelectedLayoutSegment } from "next/navigation";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useContext, useEffect, useRef } from "react";

function usePreviousValue<T>(value: T): T | undefined {
  const prevValue = useRef<T | undefined>(undefined);

  useEffect(() => {
    prevValue.current = value;
    return () => {
      prevValue.current = undefined;
    };
  });

  return prevValue.current;
}

function FrozenRouter({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const prevContext = usePreviousValue(context) || null;

  const segment = useSelectedLayoutSegment();
  const prevSegment = usePreviousValue(segment);

  const changed =
    segment !== prevSegment &&
    segment !== undefined &&
    prevSegment !== undefined;

  return (
    <LayoutRouterContext.Provider value={changed ? prevContext : context}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

interface LayoutTransitionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.ComponentProps<typeof motion.div>["style"];
  initial?: React.ComponentProps<typeof motion.div>["initial"];
  animate?: React.ComponentProps<typeof motion.div>["animate"];
  exit?: React.ComponentProps<typeof motion.div>["exit"];
  transition?: React.ComponentProps<typeof motion.div>["transition"];
}

export function LayoutTransition({
  children,
  className,
  style,
  initial = { opacity: 0 },
  animate = { opacity: 1 },
  exit = { opacity: 0 },
  transition,
}: LayoutTransitionProps) {
  const segment = useSelectedLayoutSegment();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        className={className}
        style={style}
        key={segment}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
```

### Usage in Root Layout

```tsx
// app/layout.tsx
import { LayoutTransition } from "@/components/motion/LayoutTransition";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <LayoutTransition
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            mass: 0.8,
          }}
        >
          {children}
        </LayoutTransition>
      </body>
    </html>
  );
}
```

### Premium Transition Variants for Rick's Cafe

```tsx
// Cinematic fade-and-slide (editorial feel)
const editorialTransition = {
  initial: { opacity: 0, y: 40, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -20, filter: "blur(4px)" },
  transition: {
    type: "spring",
    stiffness: 60,
    damping: 18,
    mass: 1,
    staggerChildren: 0.08,
  },
};

// Curtain reveal (dramatic, for meal detail pages)
const curtainTransition = {
  initial: { clipPath: "inset(100% 0 0 0)" },
  animate: { clipPath: "inset(0% 0 0 0)" },
  exit: { clipPath: "inset(0 0 100% 0)" },
  transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
};

// Crossfade (subtle, for navigation between similar pages)
const crossfadeTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.4, ease: "easeInOut" },
};
```

### Alternative: next-transition-router

If the FrozenRouter approach breaks on a Next.js update, consider the `next-transition-router` package as a more stable alternative:

```bash
npm install next-transition-router
```

This package provides a first-class API for page transitions with any animation library in the App Router.

---

## 3. Scroll-Driven Animations

### Core Hooks

- **`useScroll()`** -- Returns four MotionValues: `scrollX`, `scrollY`, `scrollXProgress`, `scrollYProgress`
- **`useTransform()`** -- Maps one MotionValue range to another (e.g., scroll progress to opacity)
- **`useSpring()`** -- Wraps a MotionValue with spring physics for smoother interpolation
- **`useInView()`** -- Returns boolean when element enters viewport
- **`whileInView`** -- Prop on motion components for viewport-triggered animations

### Scroll Progress Bar (Global)

```tsx
"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();

  // Apply spring for smoother feel
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-amber-700 origin-left z-50"
      style={{ scaleX }}
    />
  );
}
```

### Element-Scoped Scroll Tracking

```tsx
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function MealSection({ title, description, imageSrc }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    // "start end" = animation starts when top of element hits bottom of viewport
    // "end start" = animation ends when bottom of element hits top of viewport
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.95, 1, 1, 0.95]);

  return (
    <motion.section
      ref={sectionRef}
      style={{ opacity, scale }}
      className="min-h-screen flex items-center justify-center"
    >
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </motion.section>
  );
}
```

### Offset Reference

The `offset` array defines when animation starts and ends:

```
offset: ["start end", "end start"]
         ^           ^
         |           |
         |           When bottom of target hits top of viewport
         When top of target hits bottom of viewport

// Other common offsets:
["start start", "end start"]   // From when element enters top to when it leaves top
["start center", "end center"] // Centered viewport tracking
["start 0.8", "start 0.2"]    // Custom viewport percentages
```

### Horizontal Scroll Section

```tsx
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function HorizontalGallery({ images }: { images: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Map vertical scroll to horizontal movement
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `-${(images.length - 1) * 100}%`]
  );

  return (
    <div ref={containerRef} style={{ height: `${images.length * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          className="flex h-full"
          style={{ x }}
        >
          {images.map((src, i) => (
            <div key={i} className="min-w-full h-full flex-shrink-0">
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
```

---

## 4. Parallax Effects

### Basic Parallax -- Image Moves Slower Than Scroll

```tsx
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

interface ParallaxImageProps {
  src: string;
  alt: string;
  speed?: number; // 0.5 = half speed, 2 = double speed
}

export function ParallaxImage({ src, alt, speed = 0.5 }: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // speed < 1 = image moves slower (standard parallax)
  // speed > 1 = image moves faster (reverse parallax)
  const y = useTransform(scrollYProgress, [0, 1], [`-${speed * 20}%`, `${speed * 20}%`]);

  return (
    <div ref={ref} className="relative overflow-hidden h-[70vh]">
      <motion.div style={{ y }} className="absolute inset-[-20%]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </motion.div>
    </div>
  );
}
```

### Advanced Parallax -- Fixed Background with Clip Path

This creates a cinematic, magazine-style effect where the image appears to be revealed as you scroll past it. The image is position: fixed but clipped to its container using clip-path.

```tsx
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

export function CinematicParallax({ src, alt }: { src: string; alt: string }) {
  const container = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-10vh", "10vh"]);

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center h-screen overflow-hidden"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      {/* Fixed position image that moves with parallax */}
      <div className="fixed top-[-10vh] left-0 h-[120vh] w-full">
        <motion.div style={{ y }} className="relative w-full h-full">
          <Image src={src} alt={alt} fill className="object-cover" sizes="100vw" />
        </motion.div>
      </div>
    </div>
  );
}
```

### Multi-Layer Parallax (Depth Effect)

```tsx
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function DepthParallax() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Each layer moves at a different speed for depth illusion
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);      // Slowest (far)
  const midY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);     // Medium
  const fgY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);     // Fastest (near)
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "150%"]);   // Text floats up

  const bgOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.3]);

  return (
    <div ref={ref} className="relative h-[200vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Background layer */}
        <motion.div
          style={{ y: bgY, opacity: bgOpacity }}
          className="absolute inset-0"
        >
          <img src="/images/bg-texture.jpg" className="w-full h-full object-cover" alt="" />
        </motion.div>

        {/* Mid-ground layer */}
        <motion.div
          style={{ y: midY }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <img src="/images/dish-plate.png" className="w-1/2" alt="Featured dish" />
        </motion.div>

        {/* Foreground text */}
        <motion.div
          style={{ y: textY }}
          className="absolute inset-0 flex items-end justify-center pb-20"
        >
          <h1 className="text-8xl font-serif text-white">Tonight's Special</h1>
        </motion.div>
      </div>
    </div>
  );
}
```

### Custom useParallax Hook

```tsx
"use client";

import { useScroll, useTransform, MotionValue } from "framer-motion";
import { useRef, RefObject } from "react";

interface UseParallaxOptions {
  speed?: number;
  direction?: "vertical" | "horizontal";
  offset?: [string, string];
}

export function useParallax({
  speed = 0.5,
  direction = "vertical",
  offset = ["start end", "end start"],
}: UseParallaxOptions = {}): {
  ref: RefObject<HTMLDivElement>;
  style: { x?: MotionValue<string>; y?: MotionValue<string> };
  scrollYProgress: MotionValue<number>;
} {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset,
  });

  const distance = speed * 30;
  const transform = useTransform(
    scrollYProgress,
    [0, 1],
    [`-${distance}%`, `${distance}%`]
  );

  return {
    ref,
    style: direction === "vertical" ? { y: transform } : { x: transform },
    scrollYProgress,
  };
}
```

---

## 5. Reveal-on-Scroll Text Animations

### Basic Reveal with whileInView

The simplest approach. Best for body text and descriptions.

```tsx
"use client";

import { motion } from "framer-motion";

interface RevealTextProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

export function RevealText({
  children,
  className,
  delay = 0,
  direction = "up",
}: RevealTextProps) {
  const directionOffset = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directionOffset[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        type: "spring",
        stiffness: 60,
        damping: 18,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
```

### Character-by-Character Reveal (Premium Editorial)

Splits text into individual characters and staggers their animation. Great for hero headings.

```tsx
"use client";

import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1,
    },
  },
};

const charVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

interface CharRevealProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function CharReveal({ text, className, as: Tag = "h1" }: CharRevealProps) {
  const MotionTag = motion.create(Tag);

  return (
    <MotionTag
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      aria-label={text}
    >
      {text.split("").map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          variants={charVariants}
          style={{ display: "inline-block", whiteSpace: char === " " ? "pre" : "normal" }}
          aria-hidden="true"
        >
          {char}
        </motion.span>
      ))}
    </MotionTag>
  );
}
```

### Word-by-Word Reveal

Balanced between character-level drama and readability.

```tsx
"use client";

import { motion } from "framer-motion";

const wordContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const wordVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    rotateX: 45,
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 14,
    },
  },
};

export function WordReveal({ text, className }: { text: string; className?: string }) {
  return (
    <motion.p
      className={className}
      style={{ perspective: "800px" }}
      variants={wordContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {text.split(" ").map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={wordVariants}
          style={{ display: "inline-block", marginRight: "0.3em" }}
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  );
}
```

### Line Reveal with Overflow Clip

Creates a "mask wipe" effect where text slides up from behind a clipping boundary.

```tsx
"use client";

import { motion } from "framer-motion";

export function LineReveal({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: "100%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: true }}
        transition={{
          duration: 0.8,
          ease: [0.76, 0, 0.24, 1], // Custom cubic bezier for editorial feel
        }}
      >
        {text}
      </motion.div>
    </div>
  );
}
```

### Scroll-Linked Text Opacity (Reading Progress)

Text opacity changes as you scroll through it, highlighting the currently "active" paragraph.

```tsx
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function ScrollLinkedParagraph({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.3"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0.15, 1]);
  const blur = useTransform(scrollYProgress, [0, 1], ["blur(2px)", "blur(0px)"]);

  return (
    <motion.p
      ref={ref}
      style={{ opacity, filter: blur }}
      className="text-2xl leading-relaxed font-serif max-w-2xl"
    >
      {text}
    </motion.p>
  );
}
```

---

## 6. Micro-Interactions

### Hover Scale with Spring

```tsx
"use client";

import { motion } from "framer-motion";

export function HoverCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      whileHover={{
        scale: 1.03,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20,
        },
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}
```

### Magnetic Button Effect

The button follows the cursor when hovered, creating a magnetic pull effect. Premium feel for CTAs and navigation links.

```tsx
"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number; // 1 = full follow, 0.5 = half, etc.
}

export function MagneticButton({
  children,
  className,
  strength = 0.4,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * strength, y: middleY * strength });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 15,
        mass: 0.1,
      }}
    >
      {children}
    </motion.div>
  );
}
```

### Image Hover Zoom with Overlay

For meal photo cards -- zoom the image while dimming and revealing text.

```tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface MealCardProps {
  title: string;
  subtitle: string;
  imageSrc: string;
}

export function MealCard({ title, subtitle, imageSrc }: MealCardProps) {
  return (
    <motion.div
      className="relative overflow-hidden cursor-pointer group"
      whileHover="hover"
      initial="rest"
    >
      {/* Image with zoom */}
      <motion.div
        variants={{
          rest: { scale: 1 },
          hover: { scale: 1.08 },
        }}
        transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
      >
        <Image
          src={imageSrc}
          alt={title}
          width={600}
          height={400}
          className="w-full aspect-[3/2] object-cover"
        />
      </motion.div>

      {/* Overlay */}
      <motion.div
        className="absolute inset-0 bg-black/0 flex items-end p-8"
        variants={{
          rest: { backgroundColor: "rgba(0,0,0,0)" },
          hover: { backgroundColor: "rgba(0,0,0,0.3)" },
        }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <motion.h3
            className="text-white text-2xl font-serif"
            variants={{
              rest: { opacity: 0, y: 20 },
              hover: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {title}
          </motion.h3>
          <motion.p
            className="text-white/80 text-sm mt-1"
            variants={{
              rest: { opacity: 0, y: 10 },
              hover: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {subtitle}
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}
```

### Tap Feedback

```tsx
"use client";

import { motion } from "framer-motion";

export function TapButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      whileHover={{
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 25 },
      }}
      whileTap={{
        scale: 0.96,
        transition: { type: "spring", stiffness: 500, damping: 30 },
      }}
    >
      {children}
    </motion.button>
  );
}
```

### Underline Hover Effect (Navigation Links)

```tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="relative inline-block">
      <motion.span
        className="relative"
        whileHover="hover"
        initial="rest"
      >
        {children}
        <motion.span
          className="absolute bottom-0 left-0 h-[1px] bg-current"
          variants={{
            rest: { width: "0%" },
            hover: { width: "100%" },
          }}
          transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
        />
      </motion.span>
    </Link>
  );
}
```

### Cursor Glow / Spotlight Effect

```tsx
"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function SpotlightCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 200, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight gradient */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: `radial-gradient(
            400px circle at var(--x) var(--y),
            rgba(255, 255, 255, 0.06),
            transparent 80%
          )`,
          // @ts-ignore -- CSS custom properties
          "--x": springX,
          "--y": springY,
        }}
      />
      {children}
    </motion.div>
  );
}
```

---

## 7. Animation Variants and Orchestration

### Variants System

Variants allow you to define named animation states and propagate them through the component tree. Child components inherit variant names from parents.

```tsx
"use client";

import { motion } from "framer-motion";

// Parent container variants control orchestration
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.3,     // Wait 0.3s before starting children
      staggerChildren: 0.12,  // 0.12s between each child
      staggerDirection: 1,    // 1 = first to last, -1 = last to first
    },
  },
};

// Child variants define the actual animation
const itemVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 16,
    },
  },
};

interface StaggerListProps {
  items: { id: string; title: string; description: string }[];
}

export function StaggerList({ items }: StaggerListProps) {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {items.map((item) => (
        <motion.li
          key={item.id}
          variants={itemVariants}
          className="mb-8"
        >
          <h3 className="text-xl font-serif">{item.title}</h3>
          <p className="text-gray-600 mt-2">{item.description}</p>
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### Menu Grid with Staggered Reveal

```tsx
"use client";

import { motion } from "framer-motion";

const gridVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 18,
    },
  },
};

export function MenuGrid({ dishes }: { dishes: Dish[] }) {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      variants={gridVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {dishes.map((dish) => (
        <motion.article
          key={dish.id}
          variants={cardVariants}
          whileHover={{ y: -8, transition: { type: "spring", stiffness: 300, damping: 20 } }}
          className="cursor-pointer"
        >
          <img src={dish.image} alt={dish.name} className="aspect-[4/3] object-cover" />
          <div className="p-6">
            <h3 className="font-serif text-lg">{dish.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{dish.price}</p>
          </div>
        </motion.article>
      ))}
    </motion.div>
  );
}
```

### Orchestrated Section Reveal

Multiple elements animate in sequence when the section enters view.

```tsx
"use client";

import { motion } from "framer-motion";

const sectionVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const headingVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 60, damping: 16, duration: 0.8 },
  },
};

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
  },
};

const bodyVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 80, damping: 18 },
  },
};

export function EditorialSection({
  heading,
  body,
}: {
  heading: string;
  body: string;
}) {
  return (
    <motion.section
      className="max-w-3xl mx-auto py-32 px-6"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-120px" }}
    >
      <motion.h2
        className="text-5xl font-serif tracking-tight"
        variants={headingVariants}
      >
        {heading}
      </motion.h2>

      <motion.div
        className="h-[1px] bg-gray-300 my-8 origin-left"
        variants={lineVariants}
      />

      <motion.p
        className="text-lg leading-relaxed text-gray-600"
        variants={bodyVariants}
      >
        {body}
      </motion.p>
    </motion.section>
  );
}
```

### Shared Layout Animations (layoutId)

For smooth transitions between list and detail views (e.g., meal card to meal detail page).

```tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function MealGallery({ meals }: { meals: Meal[] }) {
  const [selected, setSelected] = useState<Meal | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {meals.map((meal) => (
          <motion.div
            key={meal.id}
            layoutId={`meal-${meal.id}`}
            onClick={() => setSelected(meal)}
            className="cursor-pointer"
          >
            <motion.img
              layoutId={`meal-image-${meal.id}`}
              src={meal.image}
              alt={meal.name}
              className="aspect-square object-cover"
            />
            <motion.h3 layoutId={`meal-title-${meal.id}`}>
              {meal.name}
            </motion.h3>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              layoutId={`meal-${selected.id}`}
              className="bg-white rounded-xl overflow-hidden max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                layoutId={`meal-image-${selected.id}`}
                src={selected.image}
                alt={selected.name}
                className="w-full aspect-video object-cover"
              />
              <div className="p-8">
                <motion.h3
                  layoutId={`meal-title-${selected.id}`}
                  className="text-3xl font-serif"
                >
                  {selected.name}
                </motion.h3>
                <p className="mt-4 text-gray-600">{selected.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

---

## 8. Momentum Scrolling and Snap-to-Section

### Lenis Smooth Scroll Setup

Lenis provides the buttery-smooth momentum scrolling feel. It works alongside Framer Motion (Framer Motion handles animations, Lenis handles the scroll physics).

```tsx
// components/SmoothScroll.tsx
"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,            // Lower = smoother, slower response (0.05-0.15 sweet spot)
      duration: 1.2,          // Duration of scroll animation
      smoothWheel: true,      // Smooth mouse wheel
      syncTouch: false,       // Disable on touch for native feel on mobile
      touchMultiplier: 2,     // Touch scroll speed
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
```

```tsx
// app/layout.tsx
import { SmoothScroll } from "@/components/SmoothScroll";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
```

### CSS Scroll Snap for Sections

Combine CSS scroll snap with Lenis for section-based navigation:

```css
/* globals.css */
.snap-container {
  scroll-snap-type: y mandatory;
}

.snap-section {
  scroll-snap-align: start;
  scroll-snap-stop: always;
  min-height: 100vh;
}

/* Alternatively, for proximity snapping (less aggressive): */
.snap-container-proximity {
  scroll-snap-type: y proximity;
}
```

```tsx
// components/SnapLayout.tsx
"use client";

import { motion } from "framer-motion";

export function SnapLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="snap-container h-screen overflow-y-auto">
      {children}
    </div>
  );
}

export function SnapSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      className={`snap-section ${className}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.section>
  );
}
```

### Lenis with Scroll Snap

When using Lenis with CSS scroll snap, be aware that Lenis's smooth scrolling can conflict with native scroll snap. Use Lenis's built-in snap support:

```tsx
"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

export function SnapSmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.06,
      smoothWheel: true,
      syncTouch: false,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Programmatic snap-to-section
  const scrollToSection = (index: number) => {
    const sections = document.querySelectorAll("[data-snap-section]");
    if (sections[index] && lenisRef.current) {
      lenisRef.current.scrollTo(sections[index] as HTMLElement, {
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Expo easing
      });
    }
  };

  return <>{children}</>;
}
```

---

## 9. Performance Best Practices

### Animate Only Transform and Opacity

Transform (`x`, `y`, `scale`, `rotate`) and `opacity` are the only CSS properties that can be GPU-accelerated and avoid triggering layout recalculations.

```tsx
// GOOD -- GPU-accelerated, no layout thrash
<motion.div
  animate={{ x: 100, scale: 1.1, opacity: 0.8, rotate: 5 }}
/>

// AVOID -- Triggers layout recalculation
<motion.div
  animate={{ width: "200px", height: "300px", top: "50px", left: "100px" }}
/>
```

### Use `will-change` Sparingly

Framer Motion automatically applies `will-change: transform` during animations. Do not add extra `will-change` properties unless profiling shows it helps -- overusing `will-change` consumes GPU memory.

```tsx
// Only add will-change if the element is ALWAYS animated (e.g., parallax images)
<motion.div
  style={{ willChange: "transform" }}
  // ... parallax animation
/>

// For intermittent animations (hover, tap), let Framer Motion handle it automatically
```

### Layout Animations

The `layout` prop enables automatic layout animations (animating between CSS layout changes). It is powerful but expensive.

```tsx
// Use layout="position" to only animate position, not size (cheaper)
<motion.div layout="position">
  {/* Animates position changes but not size changes */}
</motion.div>

// Use layout={true} only when you need both position and size animation
<motion.div layout>
  {/* Animates both position and size -- more expensive */}
</motion.div>

// layoutId for shared element transitions
<motion.div layoutId="hero-image">
  {/* Automatically animates to/from other elements with same layoutId */}
</motion.div>
```

### Avoid Re-renders with MotionValues

MotionValues update outside React's render cycle. Use `useMotionValue`, `useTransform`, and `useSpring` instead of `useState` for animation values.

```tsx
// BAD -- Causes re-render on every frame
const [scrollY, setScrollY] = useState(0);
useEffect(() => {
  const handler = () => setScrollY(window.scrollY);
  window.addEventListener("scroll", handler);
  return () => window.removeEventListener("scroll", handler);
}, []);

// GOOD -- Updates without re-rendering
const { scrollY } = useScroll();
const opacity = useTransform(scrollY, [0, 300], [1, 0]);
// Pass directly to style prop
<motion.div style={{ opacity }} />
```

### Image Optimization for Parallax

```tsx
// Use Next.js Image with appropriate sizes and priority
<Image
  src={src}
  alt={alt}
  fill
  sizes="100vw"          // Full-width parallax images
  priority={isAboveFold} // Priority load for above-fold images
  quality={85}           // Balance quality vs. file size
  placeholder="blur"     // Show blur placeholder while loading
  blurDataURL={blurHash} // Pre-computed blur hash
/>
```

### Reduce Motion Complexity on Mobile

```tsx
"use client";

import { useMotionValue, useTransform } from "framer-motion";

// Detect mobile and reduce parallax intensity
export function useResponsiveParallax(scrollYProgress: MotionValue<number>) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Reduce parallax distance on mobile for smoother performance
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    isMobile ? ["-5%", "5%"] : ["-20%", "20%"]
  );

  return y;
}
```

### Batch Animations

When animating many elements, prefer variants with `staggerChildren` over individual `useAnimation` controls:

```tsx
// GOOD -- Single animation propagation through variant tree
<motion.div variants={container} initial="hidden" animate="visible">
  {items.map((item) => (
    <motion.div key={item.id} variants={child} />
  ))}
</motion.div>

// LESS OPTIMAL -- Individual controls for each element
items.forEach((_, i) => {
  controls[i].start({ opacity: 1 });
});
```

---

## 10. Accessibility

### Global Reduced Motion Configuration

The best approach for site-wide reduced motion support. Put this in your root layout.

```tsx
// components/motion/MotionConfig.tsx
"use client";

import { MotionConfig } from "framer-motion";

export function AccessibleMotionConfig({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
```

```tsx
// app/layout.tsx
import { AccessibleMotionConfig } from "@/components/motion/MotionConfig";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AccessibleMotionConfig>
          {children}
        </AccessibleMotionConfig>
      </body>
    </html>
  );
}
```

When `reducedMotion="user"`:
- If the user has "Reduce Motion" enabled in their OS settings, all transform and layout animations are **instantly applied** (no animation).
- Opacity and color transitions **still animate** (these are generally safe for motion-sensitive users).
- This is the recommended setting for most sites.

### useReducedMotion Hook for Custom Behavior

For more granular control, use the `useReducedMotion` hook:

```tsx
"use client";

import { useReducedMotion, motion } from "framer-motion";

export function HeroAnimation() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 60, damping: 18 }
      }
    >
      <h1>Welcome to Rick's Cafe</h1>
    </motion.div>
  );
}
```

### Comprehensive Reduced Motion Strategy

```tsx
"use client";

import { useReducedMotion } from "framer-motion";

// Custom hook that returns appropriate animation values
export function useAnimationConfig() {
  const shouldReduceMotion = useReducedMotion();

  return {
    // For scroll-triggered reveals
    reveal: shouldReduceMotion
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.3 },
        }
      : {
          initial: { opacity: 0, y: 40, filter: "blur(4px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { type: "spring", stiffness: 60, damping: 18 },
        },

    // For hover interactions
    hover: shouldReduceMotion
      ? {}
      : {
          scale: 1.03,
          transition: { type: "spring", stiffness: 300, damping: 20 },
        },

    // For parallax
    parallaxStrength: shouldReduceMotion ? 0 : 1,

    // For stagger
    stagger: shouldReduceMotion ? 0 : 0.1,
  };
}
```

### CSS Fallback

Always include a CSS-level fallback as a safety net:

```css
/* globals.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 11. Spring Physics Reference

### Presets for Rick's Cafe

These spring configurations create different feels. Use them consistently across the site.

```tsx
export const springs = {
  // Gentle, editorial reveal -- headings, section entrances
  gentle: {
    type: "spring" as const,
    stiffness: 60,
    damping: 18,
    mass: 1,
  },

  // Snappy, responsive -- hover effects, micro-interactions
  snappy: {
    type: "spring" as const,
    stiffness: 300,
    damping: 25,
    mass: 0.8,
  },

  // Bouncy, playful -- tap feedback, badge animations
  bouncy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 12,
    mass: 0.5,
  },

  // Heavy, cinematic -- page transitions, large element moves
  cinematic: {
    type: "spring" as const,
    stiffness: 40,
    damping: 20,
    mass: 1.5,
  },

  // Magnetic -- cursor-following elements
  magnetic: {
    type: "spring" as const,
    stiffness: 150,
    damping: 15,
    mass: 0.1,
  },

  // Smooth progress -- scroll bars, progress indicators
  smooth: {
    type: "spring" as const,
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  },
} as const;
```

### Custom Easing Curves

For non-spring animations (clip-path, background-color), use cubic-bezier:

```tsx
export const easings = {
  // Smooth deceleration -- most general purpose
  easeOut: [0.33, 1, 0.68, 1] as const,

  // Strong deceleration -- dramatic reveals
  easeOutExpo: [0.16, 1, 0.3, 1] as const,

  // Smooth acceleration then deceleration -- page transitions
  easeInOut: [0.76, 0, 0.24, 1] as const,

  // Slight overshoot -- playful interactions
  backOut: [0.34, 1.56, 0.64, 1] as const,
} as const;
```

### Parameter Guide

| Parameter   | Low Value            | High Value          | Default |
|-------------|----------------------|---------------------|---------|
| stiffness   | Slow, gentle (20-60) | Fast, snappy (200+) | 100     |
| damping     | More bounce (5-10)   | Less bounce (20-40) | 10      |
| mass        | Light, quick (0.1-0.5) | Heavy, lethargic (1.5-3) | 1  |

---

## 12. Common Pitfalls

### 1. Missing "use client"

Every file that imports from `framer-motion` must have `"use client"` at the top. Forgetting this causes cryptic server-side rendering errors.

### 2. AnimatePresence Key Prop

`AnimatePresence` only tracks direct children. Each child **must** have a unique `key` prop for exit animations to work.

```tsx
// Correct
<AnimatePresence mode="wait">
  <motion.div key={currentPage} exit={{ opacity: 0 }}>
    {content}
  </motion.div>
</AnimatePresence>

// Wrong -- no key
<AnimatePresence mode="wait">
  <motion.div exit={{ opacity: 0 }}>
    {content}
  </motion.div>
</AnimatePresence>
```

### 3. useScroll with SSR

`useScroll` works fine during SSR (returns 0 values), but components using `window.innerWidth` or `window.innerHeight` need guards:

```tsx
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  setIsMobile(window.innerWidth < 768);
}, []);
```

### 4. Lenis + Framer Motion Scroll Conflicts

Lenis overrides native scrolling. If `useScroll` behaves erratically, ensure Lenis is initialized before Framer Motion hooks run. Use the wrapper component pattern from Section 8.

### 5. Layout Animation Flash

When using the `layout` prop, elements can flash or jump on initial render. Add `layout` to all siblings in the same container, or use `layoutScroll` on scroll containers.

### 6. AnimatePresence mode="wait" Delays

`mode="wait"` pauses the incoming animation until the exit completes. This is correct for page transitions but feels sluggish for lists. Use `mode="popLayout"` or `mode="sync"` for overlapping animations.

### 7. Over-Animating

Not every element needs animation. For Rick's Cafe, the rule is:
- **Animate:** Hero sections, section reveals, meal photos, CTAs, navigation
- **Do not animate:** Body text paragraphs (beyond initial reveal), footers, form inputs, utility elements

### 8. Filter Animations (blur, brightness)

CSS `filter` animations are NOT GPU-accelerated. Use them sparingly and only for short durations:

```tsx
// OK -- short duration, used for reveal effect
initial={{ filter: "blur(4px)" }}
animate={{ filter: "blur(0px)" }}
transition={{ duration: 0.4 }}

// AVOID -- long-running filter animation tied to scroll
const blur = useTransform(scrollYProgress, [0, 1], ["blur(0px)", "blur(20px)"]);
// This will cause jank on lower-end devices
```

---

## Quick Reference: Rick's Cafe Animation Hierarchy

| Element             | Animation Type                  | Timing          |
|---------------------|---------------------------------|-----------------|
| Page transition     | Fade + slide + blur             | 0.6-0.8s spring |
| Hero heading        | Character reveal                | stagger 0.03s   |
| Section heading     | Line reveal (overflow clip)     | 0.8s ease       |
| Body text           | Fade up (whileInView, once)     | 0.5s spring     |
| Meal photos         | Parallax + reveal               | scroll-linked   |
| Photo gallery       | Staggered grid                  | stagger 0.06s   |
| Navigation links    | Underline hover                 | 0.3s ease       |
| CTA buttons         | Magnetic + scale                | spring instant  |
| Decorative dividers | Scale-X reveal                  | 0.8s ease       |
| Full-bleed images   | Cinematic parallax (clip-path)  | scroll-linked   |

---

## Sources

- [Motion.dev Official Documentation](https://motion.dev/docs/react-scroll-animations)
- [Motion.dev Performance Guide](https://motion.dev/docs/performance)
- [Motion.dev Accessibility Guide](https://motion.dev/docs/react-accessibility)
- [Motion.dev useReducedMotion](https://motion.dev/docs/react-use-reduced-motion)
- [Motion.dev Gesture Animations](https://www.framer.com/motion/gestures/)
- [Motion.dev Transitions](https://motion.dev/docs/react-transitions)
- [Motion.dev Bundle Size Reduction](https://motion.dev/docs/react-reduce-bundle-size)
- [Motion.dev LazyMotion](https://motion.dev/docs/react-lazy-motion)
- [Motion.dev useScroll](https://motion.dev/docs/react-use-scroll)
- [Motion.dev Upgrade Guide](https://motion.dev/docs/react-upgrade-guide)
- [Solving Framer Motion Page Transitions in Next.js App Router](https://www.imcorfitz.com/posts/adding-framer-motion-page-transitions-to-next-js-app-router)
- [Olivier Larose -- Background Image Parallax](https://blog.olivierlarose.com/tutorials/background-image-parallax)
- [Olivier Larose -- Magnetic Button](https://blog.olivierlarose.com/tutorials/magnetic-button)
- [Olivier Larose -- Smooth Parallax Scroll](https://blog.olivierlarose.com/tutorials/smooth-parallax-scroll)
- [Samuel Kraft -- Spring Parallax Guide](https://samuelkraft.com/blog/spring-parallax-framer-motion-guide)
- [LogRocket -- Advanced Page Transitions](https://blog.logrocket.com/advanced-page-transitions-next-js-framer-motion/)
- [LogRocket -- React Scroll Animations](https://blog.logrocket.com/react-scroll-animations-framer-motion/)
- [Victor Eke -- Scroll Reveal Animation](https://victoreke.com/blog/scroll-reveal-animation-in-react-using-framer-motion)
- [Maxime Heckel -- Physics Behind Spring Animations](https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/)
- [Lenis Smooth Scroll](https://github.com/darkroomengineering/lenis)
- [next-transition-router](https://github.com/ismamz/next-transition-router)
- [Bridger Tower -- Lenis in Next.js](https://bridger.to/lenis-nextjs)
