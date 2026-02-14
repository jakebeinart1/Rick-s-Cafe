# Tailwind CSS Styling System -- Rick's Cafe

> Comprehensive reference for the bespoke Tailwind design system powering Rick's Cafe.
> Stack: Next.js 16 (App Router) + Tailwind CSS v4 + TypeScript.
> No generic UI libraries. Everything handcrafted.

---

## Table of Contents

1. [Tailwind v4 Fundamentals](#1-tailwind-v4-fundamentals)
2. [Typography System](#2-typography-system)
3. [Custom Spacing Scale (Heavy Whitespace)](#3-custom-spacing-scale)
4. [Color Palette](#4-color-palette)
5. [Responsive Breakpoint Strategy](#5-responsive-breakpoint-strategy)
6. [Masonry Grid Gallery](#6-masonry-grid-gallery)
7. [Snap Scroll Sections](#7-snap-scroll-sections)
8. [Sticky Positioning (Stats Bar / Header)](#8-sticky-positioning)
9. [Progress Bar Components (Scoring System)](#9-progress-bar-components)
10. [Bottom Navigation Bar (Mobile)](#10-bottom-navigation-bar)
11. [tailwind-merge + clsx Utility](#11-tailwind-merge--clsx-utility)
12. [@tailwindcss/typography Plugin](#12-tailwindcsstypography-plugin)
13. [Animation Utilities](#13-animation-utilities)
14. [Dark Mode](#14-dark-mode)
15. [Class Variance Authority (CVA)](#15-class-variance-authority)

---

## 1. Tailwind v4 Fundamentals

Tailwind CSS v4 replaces `tailwind.config.js` with a **CSS-first configuration** using the `@theme` directive. All design tokens live directly in your CSS file (`globals.css`). The framework auto-detects template files -- no `content` array needed.

### Single-file setup

```css
/* src/app/globals.css */

/* Google Font imports MUST come before @import "tailwindcss" */
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  /* All design tokens go here -- see sections below */
}
```

### Key v4 changes

| Concept | v3 | v4 |
|---|---|---|
| Config | `tailwind.config.js` | `@theme` in CSS |
| Content detection | Manual `content` array | Automatic |
| Import | Three `@tailwind` directives | `@import "tailwindcss"` |
| Plugins | `require()` in config | `@plugin` in CSS |
| Color space | RGB | OKLCH (wider gamut) |
| Layers | Manual `@layer` | Native cascade layers |
| Custom properties | Opt-in | All tokens exposed as CSS vars |

### What NOT to do in v4

- Do not create a `tailwind.config.js` unless you need a legacy plugin that requires it.
- Avoid `@apply` -- Tailwind team recommends moving away from it. Extract React components instead.
- Do not duplicate tokens in both `:root` and `@theme`. Use `@theme` as the single source of truth; Tailwind exposes them as CSS custom properties automatically.

---

## 2. Typography System

Rick's Cafe uses a dual-font system: **bold serif headings** + **clean sans-serif body**.

### Font choices

| Role | Font | Weight Range | Source |
|---|---|---|---|
| Headings | Playfair Display | 400--900 (variable) | Google Fonts |
| Body | Inter | 300--700 (variable) | Google Fonts |
| Mono (code/data) | Geist Mono | 400--700 | Next.js built-in |

### @theme font configuration

```css
@theme {
  --font-heading: "Playfair Display", "Georgia", "Times New Roman", serif;
  --font-body: "Inter", "Helvetica Neue", "Arial", sans-serif;
  --font-mono: "Geist Mono", "SF Mono", "Fira Code", monospace;
}
```

This generates utility classes: `font-heading`, `font-body`, `font-mono`.

### Type scale

Define a custom type scale that gives generous sizes for an immersive editorial feel:

```css
@theme {
  /* Type scale -- editorial / magazine feel */
  --text-xs: 0.75rem;      /* 12px -- captions, metadata */
  --text-sm: 0.875rem;     /* 14px -- small labels */
  --text-base: 1.0625rem;  /* 17px -- body (slightly larger than default 16px) */
  --text-lg: 1.25rem;      /* 20px -- lead paragraphs */
  --text-xl: 1.5rem;       /* 24px -- section subtitles */
  --text-2xl: 2rem;        /* 32px -- card titles */
  --text-3xl: 2.5rem;      /* 40px -- page section headings */
  --text-4xl: 3.25rem;     /* 52px -- hero heading (mobile) */
  --text-5xl: 4rem;        /* 64px -- hero heading (tablet) */
  --text-6xl: 5rem;        /* 80px -- hero heading (desktop) */
  --text-7xl: 6.25rem;     /* 100px -- display / splash text */
}
```

### Line heights

```css
@theme {
  --leading-none: 1;
  --leading-tight: 1.15;    /* headings */
  --leading-snug: 1.3;      /* subheadings */
  --leading-normal: 1.6;    /* body text -- generous for readability */
  --leading-relaxed: 1.75;  /* long-form prose */
  --leading-loose: 2;       /* captions with breathing room */
}
```

### Letter spacing

```css
@theme {
  --tracking-tighter: -0.03em;  /* tight display headings */
  --tracking-tight: -0.015em;   /* standard headings */
  --tracking-normal: 0;
  --tracking-wide: 0.025em;     /* uppercase labels */
  --tracking-wider: 0.05em;     /* all-caps metadata */
  --tracking-widest: 0.1em;     /* spaced-out category tags */
}
```

### Usage in components

```tsx
{/* Hero heading */}
<h1 className="font-heading text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight">
  The Midnight Ramen
</h1>

{/* Body text */}
<p className="font-body text-base leading-normal text-foreground/80">
  A steaming bowl of complexity, served at the counter of a Shibuya
  back-alley joint that doesn't bother with a sign.
</p>

{/* Uppercase metadata label */}
<span className="font-body text-xs tracking-widest uppercase text-foreground/50">
  Tokyo, Japan
</span>

{/* Pull quote */}
<blockquote className="font-heading text-2xl md:text-3xl leading-snug italic text-foreground/70">
  "Every bowl tells a story."
</blockquote>
```

### Next.js font optimization (alternative to Google Fonts CDN)

If you prefer `next/font` over CDN imports for better performance:

```tsx
// src/app/layout.tsx
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

Then in `globals.css`, reference the CSS variables:

```css
@theme {
  --font-heading: var(--font-heading), "Georgia", serif;
  --font-body: var(--font-body), "Helvetica Neue", sans-serif;
}
```

---

## 3. Custom Spacing Scale

Rick's Cafe uses a **heavy whitespace** aesthetic inspired by Graffico.it. The default Tailwind spacing scale tops out at `96` (24rem). We extend it with larger values for dramatic editorial spacing.

### Extended spacing tokens

```css
@theme {
  /* Extended spacing for heavy whitespace design */
  --spacing-18: 4.5rem;    /* 72px */
  --spacing-22: 5.5rem;    /* 88px */
  --spacing-26: 6.5rem;    /* 104px */
  --spacing-30: 7.5rem;    /* 120px */
  --spacing-36: 9rem;      /* 144px */
  --spacing-44: 11rem;     /* 176px */
  --spacing-52: 13rem;     /* 208px */
  --spacing-72: 18rem;     /* 288px */
  --spacing-80: 20rem;     /* 320px */
  --spacing-96: 24rem;     /* 384px */
  --spacing-112: 28rem;    /* 448px */
  --spacing-128: 32rem;    /* 512px */
  --spacing-144: 36rem;    /* 576px */
}
```

These generate utilities like `py-128`, `mt-112`, `gap-36`, etc.

### Section spacing pattern

For immersive full-page feel, use generous vertical padding on sections:

```tsx
{/* Section with heavy whitespace */}
<section className="py-36 md:py-52 lg:py-72 px-6 md:px-12 lg:px-20">
  <div className="max-w-5xl mx-auto">
    <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl mb-12 md:mb-18 lg:mb-26">
      Latest Discoveries
    </h2>
    {/* Content */}
  </div>
</section>

{/* Divider with breathing room */}
<div className="py-18 md:py-26 lg:py-36">
  <hr className="border-foreground/10 max-w-5xl mx-auto" />
</div>
```

### Container width tokens

```css
@theme {
  /* Custom max-widths for content containers */
  --container-prose: 42rem;    /* 672px -- long-form reading */
  --container-content: 64rem;  /* 1024px -- standard content */
  --container-wide: 80rem;     /* 1280px -- gallery / grid */
  --container-full: 90rem;     /* 1440px -- max site width */
}
```

Usage: `max-w-prose`, `max-w-content`, `max-w-wide`, `max-w-full`.

---

## 4. Color Palette

Tailwind v4 uses **OKLCH** by default -- perceptually uniform with wider gamut support.

### Rick's Cafe color tokens

```css
@theme {
  /* --- Brand colors --- */
  --color-cream: oklch(0.96 0.01 85);          /* warm off-white background */
  --color-espresso: oklch(0.18 0.03 50);        /* near-black with warm undertone */
  --color-bourbon: oklch(0.55 0.12 55);         /* warm amber accent */
  --color-copper: oklch(0.62 0.14 45);          /* secondary accent */
  --color-sage: oklch(0.65 0.08 155);           /* muted green for freshness */
  --color-smoke: oklch(0.40 0.02 260);          /* cool neutral gray */

  /* --- Semantic colors --- */
  --color-background: var(--color-cream);
  --color-foreground: var(--color-espresso);
  --color-accent: var(--color-bourbon);
  --color-accent-secondary: var(--color-copper);
  --color-muted: var(--color-smoke);
  --color-success: oklch(0.65 0.15 145);
  --color-warning: oklch(0.70 0.15 75);
  --color-error: oklch(0.55 0.2 25);

  /* --- Surface colors --- */
  --color-surface: oklch(0.97 0.005 85);        /* slightly off-white cards */
  --color-surface-elevated: oklch(0.99 0.003 85); /* modals, popovers */
  --color-border: oklch(0.88 0.01 85);          /* subtle warm border */
  --color-border-strong: oklch(0.70 0.02 85);

  /* --- Score axis colors (for 5-axis breakdown) --- */
  --color-score-taste: oklch(0.60 0.18 25);     /* warm red */
  --color-score-vibe: oklch(0.55 0.15 290);     /* deep purple */
  --color-score-service: oklch(0.60 0.12 195);  /* teal */
  --color-score-value: oklch(0.65 0.15 145);    /* green */
  --color-score-rick: oklch(0.55 0.12 55);      /* bourbon/gold */
}
```

### Usage

```tsx
<div className="bg-cream text-espresso">
  <span className="text-bourbon">Highlighted</span>
  <div className="bg-surface border border-border rounded-lg p-8">
    Card content
  </div>
</div>
```

---

## 5. Responsive Breakpoint Strategy

Tailwind v4 is mobile-first. Unprefixed classes apply to all screens; prefixed classes apply at that breakpoint **and above**.

### Custom breakpoints

```css
@theme {
  --breakpoint-xs: 28rem;   /* 448px  -- large phones */
  --breakpoint-sm: 40rem;   /* 640px  -- small tablets */
  --breakpoint-md: 48rem;   /* 768px  -- tablets */
  --breakpoint-lg: 64rem;   /* 1024px -- laptops */
  --breakpoint-xl: 80rem;   /* 1280px -- desktops */
  --breakpoint-2xl: 96rem;  /* 1536px -- wide screens */
}
```

### Design strategy by breakpoint

| Breakpoint | Target | Layout | Navigation |
|---|---|---|---|
| default (0+) | phones | single column, snap scroll | bottom dock nav |
| `xs` (448px+) | large phones | single column, larger type | bottom dock nav |
| `sm` (640px+) | small tablets | 2-col grid where needed | bottom dock nav |
| `md` (768px+) | tablets | 2-col layouts, sidebar appears | top nav |
| `lg` (1024px+) | laptops | full layout, sticky sidebar | top nav + sidebar |
| `xl` (1280px+) | desktops | max-width container, cinematic spacing | top nav + sidebar |
| `2xl` (1536px+) | wide | centered with generous margins | top nav + sidebar |

### Pattern: mobile-first responsive component

```tsx
<article className={`
  /* Mobile: single column, compact */
  px-6 py-12

  /* Tablet: more breathing room */
  md:px-12 md:py-26

  /* Desktop: cinematic spacing */
  lg:px-20 lg:py-36

  /* Wide: capped width, centered */
  xl:max-w-wide xl:mx-auto
`}>
  <h1 className="
    font-heading
    text-3xl leading-tight          /* mobile */
    md:text-4xl                      /* tablet */
    lg:text-5xl lg:tracking-tight    /* desktop */
    xl:text-6xl                      /* wide */
  ">
    Restaurant Name
  </h1>
</article>
```

---

## 6. Masonry Grid Gallery

For the restaurant photo gallery, use CSS `columns` -- the simplest pure-CSS masonry approach. No JavaScript needed.

### Basic masonry with Tailwind columns

```tsx
interface GalleryProps {
  images: { src: string; alt: string; aspectRatio?: string }[];
}

function MasonryGallery({ images }: GalleryProps) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {images.map((image, i) => (
        <div key={i} className="break-inside-avoid">
          <img
            src={image.src}
            alt={image.alt}
            className="w-full rounded-lg object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
```

### Key classes explained

| Class | Purpose |
|---|---|
| `columns-1 sm:columns-2 lg:columns-3` | Responsive column count |
| `gap-4` | Gutter between columns |
| `space-y-4` | Vertical gap between items within a column |
| `break-inside-avoid` | Prevents items from being split across columns |

### Enhanced masonry with hover effects

```tsx
<div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
  {images.map((image, i) => (
    <div
      key={i}
      className="break-inside-avoid group relative overflow-hidden rounded-lg cursor-pointer"
    >
      <img
        src={image.src}
        alt={image.alt}
        className="
          w-full object-cover
          transition-transform duration-500 ease-out
          group-hover:scale-105
        "
        loading="lazy"
      />
      {/* Hover overlay */}
      <div className="
        absolute inset-0
        bg-espresso/0 group-hover:bg-espresso/40
        transition-colors duration-500
        flex items-end p-6
      ">
        <span className="
          font-body text-sm text-cream tracking-wide uppercase
          translate-y-4 opacity-0
          group-hover:translate-y-0 group-hover:opacity-100
          transition-all duration-500 delay-100
        ">
          {image.alt}
        </span>
      </div>
    </div>
  ))}
</div>
```

### CSS Grid masonry (experimental -- future CSS spec)

When `display: masonry` or `masonry-template-*` properties gain broader support, the approach will shift. For now, the columns-based method is production-ready.

---

## 7. Snap Scroll Sections

For the immersive mobile experience, use CSS Scroll Snap to create full-page section snapping.

### Full-page snap scroll (mobile only)

```tsx
{/* Parent: snap container -- only on mobile */}
<main className="
  h-screen overflow-y-scroll
  snap-y snap-mandatory
  md:h-auto md:overflow-visible md:snap-none
">
  {/* Each section snaps to start */}
  <section className="
    h-screen snap-start snap-always
    flex items-center justify-center
    px-6
    md:h-auto md:snap-align-none md:py-26
  ">
    <div className="max-w-xl">
      <h2 className="font-heading text-4xl">Section One</h2>
      <p className="font-body text-base mt-6 leading-normal">Content here...</p>
    </div>
  </section>

  <section className="
    h-screen snap-start snap-always
    flex items-center justify-center
    px-6
    md:h-auto md:snap-align-none md:py-26
  ">
    <div className="max-w-xl">
      <h2 className="font-heading text-4xl">Section Two</h2>
    </div>
  </section>
</main>
```

### Key snap utilities

| Utility | Purpose |
|---|---|
| `snap-y` | Enable vertical snap scrolling on container |
| `snap-mandatory` | Always snap (don't allow resting between points) |
| `snap-proximity` | Only snap when close to a snap point (softer) |
| `snap-start` | Child snaps to its top edge |
| `snap-center` | Child snaps to its center |
| `snap-always` | Prevent skipping past this snap point |

### Horizontal snap scroll (for image carousels)

```tsx
<div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-6 -mx-6 scrollbar-hide">
  {images.map((image, i) => (
    <div
      key={i}
      className="snap-center shrink-0 first:pl-6 last:pr-6"
    >
      <img
        src={image.src}
        alt={image.alt}
        className="w-80 h-96 object-cover rounded-lg"
      />
    </div>
  ))}
</div>
```

### Hide scrollbar utility

Add to `globals.css`:

```css
@utility scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
```

---

## 8. Sticky Positioning

Used for the Stats Bar (scoring sidebar) and site header.

### Sticky header

```tsx
<header className="
  sticky top-0 z-50
  bg-background/80 backdrop-blur-lg
  border-b border-border/50
  transition-colors duration-300
">
  <nav className="max-w-wide mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
    <a href="/" className="font-heading text-xl">Rick's Cafe</a>
    {/* Nav items */}
  </nav>
</header>
```

### Sticky sidebar (Stats Bar on restaurant detail page)

```tsx
<div className="lg:grid lg:grid-cols-12 lg:gap-12 max-w-wide mx-auto px-6 md:px-12">
  {/* Main content */}
  <main className="lg:col-span-8">
    {/* Restaurant content, gallery, review text */}
  </main>

  {/* Sticky sidebar -- only on large screens */}
  <aside className="
    hidden lg:block lg:col-span-4
    lg:self-start lg:sticky lg:top-20
  ">
    <div className="bg-surface rounded-xl p-8 border border-border">
      <h3 className="font-heading text-xl mb-6">Score Breakdown</h3>
      {/* Score progress bars go here */}
    </div>
  </aside>
</div>
```

### Key sticky rules

- `sticky` only works when the parent has scrollable overflow.
- Pair `sticky` with `top-{n}` to set the offset from the top of the viewport.
- Use `self-start` in grid layouts so the sidebar does not stretch to the grid row height.
- If a fixed navbar exists at `h-16` (4rem), use `top-20` (5rem) to clear it with breathing room.

---

## 9. Progress Bar Components

For the 5-axis scoring system (Taste, Vibe, Service, Value, Rick Factor).

### Basic score bar

```tsx
interface ScoreBarProps {
  label: string;
  score: number;    // 0-10
  color?: string;   // Tailwind bg class
  maxScore?: number;
}

function ScoreBar({ label, score, color = "bg-bourbon", maxScore = 10 }: ScoreBarProps) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="font-body text-sm tracking-wide uppercase text-foreground/60">
          {label}
        </span>
        <span className="font-heading text-lg tabular-nums">
          {score.toFixed(1)}
        </span>
      </div>
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

### Full score breakdown component

```tsx
const SCORE_AXES = [
  { key: "taste",   label: "Taste",       color: "bg-score-taste" },
  { key: "vibe",    label: "Vibe",        color: "bg-score-vibe" },
  { key: "service", label: "Service",     color: "bg-score-service" },
  { key: "value",   label: "Value",       color: "bg-score-value" },
  { key: "rick",    label: "Rick Factor", color: "bg-score-rick" },
] as const;

interface ScoreBreakdownProps {
  scores: Record<string, number>;
  overall: number;
}

function ScoreBreakdown({ scores, overall }: ScoreBreakdownProps) {
  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className="text-center pb-6 border-b border-border">
        <span className="font-heading text-5xl tabular-nums">{overall.toFixed(1)}</span>
        <span className="font-body text-sm text-foreground/50 block mt-1 tracking-wider uppercase">
          Overall
        </span>
      </div>

      {/* Individual axes */}
      <div className="space-y-5">
        {SCORE_AXES.map((axis) => (
          <ScoreBar
            key={axis.key}
            label={axis.label}
            score={scores[axis.key] ?? 0}
            color={axis.color}
          />
        ))}
      </div>
    </div>
  );
}
```

### Animated progress bar (entry animation)

```tsx
"use client";

import { useEffect, useState } from "react";

function AnimatedScoreBar({ label, score, color = "bg-bourbon", maxScore = 10 }: ScoreBarProps) {
  const [width, setWidth] = useState(0);
  const percentage = (score / maxScore) * 100;

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setWidth(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="font-body text-sm tracking-wide uppercase text-foreground/60">
          {label}
        </span>
        <span className="font-heading text-lg tabular-nums">{score.toFixed(1)}</span>
      </div>
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
```

---

## 10. Bottom Navigation Bar

Fixed bottom nav for mobile -- hidden on desktop where top nav / sidebar take over.

### Implementation

```tsx
function BottomNav() {
  return (
    <nav className="
      fixed inset-x-0 bottom-0 z-50
      md:hidden
      bg-background/90 backdrop-blur-lg
      border-t border-border/50
      safe-bottom
    ">
      <div className="flex items-center justify-around h-16 px-2">
        <BottomNavItem icon={<HomeIcon />} label="Home" href="/" />
        <BottomNavItem icon={<MapIcon />} label="Explore" href="/explore" />
        <BottomNavItem icon={<SearchIcon />} label="Search" href="/search" />
        <BottomNavItem icon={<UserIcon />} label="About" href="/about" />
      </div>
    </nav>
  );
}

function BottomNavItem({
  icon,
  label,
  href,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`
        flex flex-col items-center justify-center gap-1
        w-16 h-full
        text-xs font-body tracking-wide
        transition-colors duration-200
        ${active ? "text-accent" : "text-foreground/50 hover:text-foreground/80"}
      `}
    >
      <span className="w-5 h-5">{icon}</span>
      <span>{label}</span>
    </a>
  );
}
```

### Safe area for iOS notch/home indicator

Add to `globals.css`:

```css
@utility safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@utility safe-top {
  padding-top: env(safe-area-inset-top, 0px);
}
```

Also add the viewport meta tag in your root layout:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

### Add bottom padding to main content on mobile

When using a fixed bottom nav, prevent content from being hidden behind it:

```tsx
<main className="pb-20 md:pb-0">
  {/* Page content */}
</main>
```

---

## 11. tailwind-merge + clsx Utility

Essential for building composable components where className props can override defaults without conflicts.

### Installation

```bash
npm install tailwind-merge clsx
```

### The `cn` utility function

Create at `src/lib/utils.ts`:

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### How it works

1. **clsx** handles conditional class logic (objects, arrays, falsy values).
2. **twMerge** resolves Tailwind class conflicts intelligently (later classes win).

```ts
import { cn } from "@/lib/utils";

// Basic merging
cn("px-4 py-2", "px-8");
// => "py-2 px-8"  (px-8 overrides px-4)

// Conditional classes
cn("text-base", {
  "text-lg font-bold": isLarge,
  "text-red-500": hasError,
});

// Prop overrides
cn("bg-bourbon text-cream rounded-lg px-6 py-3", className);
// If className="bg-red-500 px-8", result is:
// => "text-cream rounded-lg py-3 bg-red-500 px-8"
```

### Pattern: composable component with cn

```tsx
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        "inline-flex items-center justify-center rounded-lg font-body font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",

        // Variant styles
        {
          "bg-accent text-cream hover:bg-accent/90": variant === "primary",
          "bg-surface text-foreground border border-border hover:bg-border/50": variant === "secondary",
          "bg-transparent text-foreground hover:bg-surface": variant === "ghost",
        },

        // Size styles
        {
          "text-sm px-4 py-2 h-9": size === "sm",
          "text-base px-6 py-3 h-11": size === "md",
          "text-lg px-8 py-4 h-13": size === "lg",
        },

        // External overrides (MUST be last so they win)
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Why this matters for Rick's Cafe

Without `twMerge`, passing `className="px-8"` to a component that has `px-6` results in *both* classes being applied, and CSS specificity determines the winner unpredictably. With `twMerge`, the later class cleanly replaces the earlier one.

---

## 12. @tailwindcss/typography Plugin

For rendering rich text / Markdown content from Sanity CMS with beautiful defaults.

### Installation and setup

```bash
npm install @tailwindcss/typography
```

In `globals.css`:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

### Basic usage

```tsx
{/* Wrap CMS content in prose */}
<article className="prose prose-lg max-w-prose mx-auto">
  <div dangerouslySetInnerHTML={{ __html: renderedMarkdown }} />
</article>
```

### Customizing prose styles

Override the default prose styles to match Rick's Cafe design:

```css
/* In globals.css, after @plugin */

.prose {
  --tw-prose-body: var(--color-foreground);
  --tw-prose-headings: var(--color-espresso);
  --tw-prose-links: var(--color-bourbon);
  --tw-prose-bold: var(--color-espresso);
  --tw-prose-quotes: var(--color-foreground);
  --tw-prose-quote-borders: var(--color-bourbon);
  --tw-prose-counters: var(--color-muted);
  --tw-prose-bullets: var(--color-muted);
  --tw-prose-hr: var(--color-border);
  --tw-prose-captions: var(--color-muted);
  --tw-prose-code: var(--color-espresso);
  --tw-prose-th-borders: var(--color-border);
  --tw-prose-td-borders: var(--color-border);

  /* Dark mode inversions */
  --tw-prose-invert-body: var(--color-cream);
  --tw-prose-invert-headings: var(--color-cream);
  --tw-prose-invert-links: var(--color-copper);
}

/* Typography overrides */
.prose :where(h1, h2, h3, h4):not(:where([class~="not-prose"] *)) {
  font-family: var(--font-heading);
  letter-spacing: -0.015em;
}

.prose :where(p, li, blockquote):not(:where([class~="not-prose"] *)) {
  font-family: var(--font-body);
  line-height: 1.6;
}

.prose :where(blockquote):not(:where([class~="not-prose"] *)) {
  font-family: var(--font-heading);
  font-style: italic;
  border-left-width: 3px;
}
```

### Size modifiers

| Class | Base font size |
|---|---|
| `prose-sm` | 14px |
| `prose` (default) | 16px |
| `prose-lg` | 18px |
| `prose-xl` | 20px |
| `prose-2xl` | 24px |

### Useful modifiers

```tsx
<article className="
  prose prose-lg
  max-w-none                         /* Remove max-width cap */
  prose-headings:font-heading        /* Element modifier */
  prose-a:text-bourbon               /* Link color */
  prose-a:no-underline               /* Remove link underline */
  prose-a:hover:text-copper          /* Link hover */
  prose-img:rounded-lg               /* Round images */
  prose-img:shadow-lg                /* Shadow on images */
  dark:prose-invert                  /* Dark mode */
">
  {/* Rich text content */}
</article>
```

### Escaping prose (embedded components)

Use `not-prose` to embed custom components inside prose content:

```tsx
<article className="prose prose-lg">
  <h2>The Review</h2>
  <p>Paragraph of review content...</p>

  {/* Custom component -- opt out of prose styles */}
  <div className="not-prose my-12">
    <ScoreBreakdown scores={scores} overall={8.7} />
  </div>

  <p>More review content...</p>
</article>
```

---

## 13. Animation Utilities

Custom animations for the immersive Rick's Cafe experience. Always respect `prefers-reduced-motion`.

### Custom keyframes and animations in @theme

```css
@theme {
  /* Fade in from below */
  --animate-fade-up: fade-up 0.6s ease-out forwards;

  /* Fade in (opacity only) */
  --animate-fade-in: fade-in 0.5s ease-out forwards;

  /* Slide in from right */
  --animate-slide-in-right: slide-in-right 0.5s ease-out forwards;

  /* Subtle scale-in */
  --animate-scale-in: scale-in 0.4s ease-out forwards;

  /* Slow Ken Burns zoom (for hero images) */
  --animate-ken-burns: ken-burns 20s ease-in-out infinite alternate;

  /* Gentle float (for decorative elements) */
  --animate-float: float 6s ease-in-out infinite;

  /* Stagger delay tokens (use with animation-delay) */
  --animate-delay-1: 0.1s;
  --animate-delay-2: 0.2s;
  --animate-delay-3: 0.3s;
  --animate-delay-4: 0.4s;
  --animate-delay-5: 0.5s;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes ken-burns {
  from { transform: scale(1); }
  to { transform: scale(1.08); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

### Usage

```tsx
{/* Fade up on load */}
<h1 className="animate-fade-up opacity-0">Welcome to Rick's Cafe</h1>

{/* Staggered children */}
<div className="space-y-4">
  <div className="animate-fade-up opacity-0" style={{ animationDelay: "0.1s" }}>Item 1</div>
  <div className="animate-fade-up opacity-0" style={{ animationDelay: "0.2s" }}>Item 2</div>
  <div className="animate-fade-up opacity-0" style={{ animationDelay: "0.3s" }}>Item 3</div>
</div>

{/* Hero image with Ken Burns */}
<div className="overflow-hidden">
  <img className="animate-ken-burns w-full h-screen object-cover" src="..." alt="..." />
</div>
```

### Transition utilities (for hover/state changes)

```tsx
{/* Smooth hover transitions */}
<a className="
  transition-all duration-300 ease-out
  hover:translate-y-[-2px]
  hover:shadow-lg
  active:translate-y-0
  active:shadow-none
">
  Card Link
</a>

{/* Color transition */}
<button className="
  bg-accent text-cream
  transition-colors duration-200
  hover:bg-accent/90
">
  Click
</button>

{/* Transform + opacity combo */}
<div className="
  transition-[transform,opacity] duration-500 ease-out
  hover:scale-[1.02] hover:opacity-90
">
  Image container
</div>
```

### Respecting reduced motion

Always provide a reduced-motion fallback:

```tsx
<div className="
  animate-fade-up
  motion-reduce:animate-none motion-reduce:opacity-100
">
  Content
</div>
```

Or globally in `globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Integration with Framer Motion

Since Rick's Cafe uses Framer Motion for page transitions and GSAP for timeline animations, use Tailwind animations for:

- CSS-only micro-interactions (hover effects, focus rings)
- Entry animations on static elements
- Decorative ambient motion (Ken Burns, float)

Use Framer Motion / GSAP for:

- Page transitions (AnimatePresence)
- Scroll-driven animations
- Complex orchestrated sequences
- Physics-based motion

---

## 14. Dark Mode

Tailwind v4 supports dark mode via the `dark:` variant. Rick's Cafe should support both light and dark themes.

### Strategy: CSS variables with theme switching

```css
/* globals.css */

:root {
  --color-background: oklch(0.96 0.01 85);       /* cream */
  --color-foreground: oklch(0.18 0.03 50);        /* espresso */
  --color-surface: oklch(0.97 0.005 85);
  --color-border: oklch(0.88 0.01 85);
  --color-accent: oklch(0.55 0.12 55);            /* bourbon */
}

.dark {
  --color-background: oklch(0.13 0.02 260);       /* deep charcoal */
  --color-foreground: oklch(0.92 0.01 85);         /* warm light */
  --color-surface: oklch(0.17 0.015 260);
  --color-border: oklch(0.25 0.015 260);
  --color-accent: oklch(0.65 0.14 55);            /* brighter bourbon for dark bg */
}
```

### Theme toggle pattern

```tsx
"use client";

import { useEffect, useState } from "react";

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Check system preference on mount
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const stored = localStorage.getItem("theme");
    setDark(stored === "dark" || (!stored && prefersDark));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-2 rounded-lg hover:bg-surface transition-colors"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
```

### Dark mode usage

```tsx
<div className="bg-background text-foreground">
  {/* These automatically adapt because they reference CSS variables */}
</div>

{/* For one-off overrides */}
<span className="text-foreground/60 dark:text-foreground/40">Muted text</span>
<div className="border-border dark:border-border/50">Card</div>
```

### Prose dark mode

```tsx
<article className="prose prose-lg dark:prose-invert">
  {/* Content automatically inverts */}
</article>
```

---

## 15. Class Variance Authority (CVA)

For components with multiple variants and compound styles. Works alongside the `cn` utility.

### Installation

```bash
npm install class-variance-authority
```

### Pattern: CVA + cn

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Base styles
  "inline-flex items-center rounded-full font-body font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-surface text-foreground border border-border",
        accent: "bg-accent/10 text-accent border border-accent/20",
        score: "bg-score-rick/10 text-score-rick",
        muted: "bg-border/50 text-foreground/60",
      },
      size: {
        sm: "text-xs px-2.5 py-0.5",
        md: "text-sm px-3 py-1",
        lg: "text-base px-4 py-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

### Usage

```tsx
<Badge>Default</Badge>
<Badge variant="accent">Featured</Badge>
<Badge variant="score" size="lg">8.7</Badge>
<Badge variant="muted" size="sm" className="uppercase tracking-wider">Tokyo</Badge>
```

### When to use CVA vs plain cn

| Scenario | Use |
|---|---|
| Component with 2+ variant dimensions | CVA |
| Simple conditional classes | cn with object syntax |
| One-off style overrides | cn only |
| Compound variants (e.g., "if primary AND large, add extra shadow") | CVA |

---

## Quick Reference: Complete globals.css

Putting it all together -- a complete `globals.css` for Rick's Cafe:

```css
/* === Font Imports (must come before @import "tailwindcss") === */
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

/* === Tailwind === */
@import "tailwindcss";
@plugin "@tailwindcss/typography";

/* === Design Tokens === */
@theme {
  /* Fonts */
  --font-heading: "Playfair Display", "Georgia", "Times New Roman", serif;
  --font-body: "Inter", "Helvetica Neue", "Arial", sans-serif;
  --font-mono: "Geist Mono", "SF Mono", "Fira Code", monospace;

  /* Type Scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1.0625rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5rem;
  --text-2xl: 2rem;
  --text-3xl: 2.5rem;
  --text-4xl: 3.25rem;
  --text-5xl: 4rem;
  --text-6xl: 5rem;
  --text-7xl: 6.25rem;

  /* Line Height */
  --leading-tight: 1.15;
  --leading-snug: 1.3;
  --leading-normal: 1.6;
  --leading-relaxed: 1.75;

  /* Letter Spacing */
  --tracking-tighter: -0.03em;
  --tracking-tight: -0.015em;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0.1em;

  /* Extended Spacing */
  --spacing-18: 4.5rem;
  --spacing-22: 5.5rem;
  --spacing-26: 6.5rem;
  --spacing-30: 7.5rem;
  --spacing-112: 28rem;
  --spacing-128: 32rem;
  --spacing-144: 36rem;

  /* Colors (OKLCH) */
  --color-cream: oklch(0.96 0.01 85);
  --color-espresso: oklch(0.18 0.03 50);
  --color-bourbon: oklch(0.55 0.12 55);
  --color-copper: oklch(0.62 0.14 45);
  --color-sage: oklch(0.65 0.08 155);
  --color-smoke: oklch(0.40 0.02 260);

  --color-background: var(--color-cream);
  --color-foreground: var(--color-espresso);
  --color-accent: var(--color-bourbon);
  --color-surface: oklch(0.97 0.005 85);
  --color-border: oklch(0.88 0.01 85);

  --color-score-taste: oklch(0.60 0.18 25);
  --color-score-vibe: oklch(0.55 0.15 290);
  --color-score-service: oklch(0.60 0.12 195);
  --color-score-value: oklch(0.65 0.15 145);
  --color-score-rick: oklch(0.55 0.12 55);

  /* Breakpoints */
  --breakpoint-xs: 28rem;
  --breakpoint-sm: 40rem;
  --breakpoint-md: 48rem;
  --breakpoint-lg: 64rem;
  --breakpoint-xl: 80rem;
  --breakpoint-2xl: 96rem;

  /* Animations */
  --animate-fade-up: fade-up 0.6s ease-out forwards;
  --animate-fade-in: fade-in 0.5s ease-out forwards;
  --animate-slide-in-right: slide-in-right 0.5s ease-out forwards;
  --animate-scale-in: scale-in 0.4s ease-out forwards;
  --animate-ken-burns: ken-burns 20s ease-in-out infinite alternate;
  --animate-float: float 6s ease-in-out infinite;
}

/* === Keyframes === */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes ken-burns {
  from { transform: scale(1); }
  to { transform: scale(1.08); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* === Custom Utilities === */
@utility scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

@utility safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@utility safe-top {
  padding-top: env(safe-area-inset-top, 0px);
}

/* === Dark Mode Variables === */
.dark {
  --color-background: oklch(0.13 0.02 260);
  --color-foreground: oklch(0.92 0.01 85);
  --color-surface: oklch(0.17 0.015 260);
  --color-border: oklch(0.25 0.015 260);
  --color-accent: oklch(0.65 0.14 55);
}

/* === Prose Overrides === */
.prose {
  --tw-prose-body: var(--color-foreground);
  --tw-prose-headings: var(--color-espresso);
  --tw-prose-links: var(--color-bourbon);
  --tw-prose-quote-borders: var(--color-bourbon);
}

.prose :where(h1, h2, h3, h4):not(:where([class~="not-prose"] *)) {
  font-family: var(--font-heading);
}

.prose :where(p, li):not(:where([class~="not-prose"] *)) {
  font-family: var(--font-body);
}

/* === Reduced Motion === */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* === Base === */
body {
  font-family: var(--font-body);
  background: var(--color-background);
  color: var(--color-foreground);
}
```

---

## Dependencies Checklist

```bash
# Required
npm install tailwind-merge clsx

# Recommended
npm install @tailwindcss/typography class-variance-authority

# Already installed
# tailwindcss@^4, @tailwindcss/postcss, next@16
```

---

## Sources

- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS Theme Variables](https://tailwindcss.com/docs/theme)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Tailwind CSS Scroll Snap Type](https://tailwindcss.com/docs/scroll-snap-type)
- [Tailwind CSS Scroll Snap Align](https://tailwindcss.com/docs/scroll-snap-align)
- [Tailwind CSS Animation](https://tailwindcss.com/docs/animation)
- [Tailwind CSS Position (Sticky)](https://tailwindcss.com/docs/position)
- [Tailwind CSS Font Family](https://tailwindcss.com/docs/font-family)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/colors)
- [@tailwindcss/typography GitHub](https://github.com/tailwindlabs/tailwindcss-typography)
- [tailwind-merge + clsx Pattern](https://stevekinney.com/courses/tailwind/clsx-and-tailwind-merge)
- [CVA Documentation](https://cva.style/docs)
- [Tailwind CSS v4 Complete Guide 2026](https://devtoolbox.dedyn.io/blog/tailwind-css-v4-complete-guide)
- [Custom Fonts in Tailwind v4](https://harrisonbroadbent.com/blog/tailwind-custom-fonts/)
- [Masonry Layouts with Tailwind CSS](https://cruip.com/masonry-layouts-with-tailwind-css/)
- [Tailwind CSS Masonry Layout](https://www.june.so/blog/tailwind-css-masonry-layout)
- [Flowbite Bottom Navigation](https://flowbite.com/docs/components/bottom-navigation/)
- [Flowbite Progress Bar](https://flowbite.com/docs/components/progress/)
- [OKLCH Colors in Tailwind](https://stevekinney.com/courses/tailwind/oklch-colors)
- [Better Dynamic Themes with OKLCH](https://evilmartians.com/chronicles/better-dynamic-themes-in-tailwind-with-oklch-color-magic)
- [Custom Fonts in Next.js 15 + Tailwind v4](https://www.buildwithmatija.com/blog/how-to-use-custom-google-fonts-in-next-js-15-and-tailwind-v4)
- [CVA React + Tailwind Example](https://cva.style/docs/examples/react/tailwind-css)
- [Tailwind Best Practices 2025](https://www.faraazcodes.com/blog/tailwind-2025-best-practices)
