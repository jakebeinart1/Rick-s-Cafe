# GSAP + Lenis Smooth Scrolling Skills

> Comprehensive reference for GSAP 3, ScrollTrigger, Lenis smooth scrolling, and Framer Motion coexistence in Next.js App Router. Tailored for Rick's Cafe immersive scroll-driven timeline.

---

## Table of Contents

1. [GSAP Setup in Next.js App Router](#1-gsap-setup-in-nextjs-app-router)
2. [ScrollTrigger Basics and Advanced Patterns](#2-scrolltrigger-basics-and-advanced-patterns)
3. [Timeline Animation Implementation](#3-timeline-animation-implementation)
4. [Horizontal Scroll Section](#4-horizontal-scroll-section)
5. [Lenis Setup and Configuration](#5-lenis-setup-and-configuration)
6. [Lenis + GSAP ScrollTrigger Integration](#6-lenis--gsap-scrolltrigger-integration)
7. [Pin/Unpin Sections Pattern](#7-pinunpin-sections-pattern)
8. [Custom Cursor Implementation](#8-custom-cursor-implementation)
9. [Magnetic Cursor Effect](#9-magnetic-cursor-effect)
10. [GSAP + Framer Motion Coexistence](#10-gsap--framer-motion-coexistence)
11. [Cleanup and Memory Management](#11-cleanup-and-memory-management)
12. [Performance Optimization](#12-performance-optimization)
13. [GSAP Licensing Notes](#13-gsap-licensing-notes)

---

## 1. GSAP Setup in Next.js App Router

### Installation

```bash
npm install gsap @gsap/react
```

Since Webflow's acquisition (2024), ALL GSAP plugins are free including ScrollTrigger, SplitText, MorphSVG, DrawSVG, ScrollSmoother, and more. Install the full package:

```bash
npm install gsap
```

### The useGSAP Hook (Non-Negotiable Best Practice)

Always use `useGSAP()` from `@gsap/react` instead of `useEffect` or `useLayoutEffect`. It provides:

- **Automatic cleanup** of all GSAP animations, timelines, ScrollTriggers, and Draggables on unmount.
- **Scoped selectors** so `.box` only targets elements inside the component's DOM tree.
- **SSR safety** via `useIsomorphicLayoutEffect` internally.

### Basic Setup Pattern

```tsx
'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins ONCE at module level (not inside components)
gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function AnimatedSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // All GSAP code here is automatically scoped and cleaned up
    gsap.to('.box', { x: 360, duration: 1 });
  }, { scope: containerRef }); // scope limits selector queries to this container

  return (
    <div ref={containerRef}>
      <div className="box">Animated</div>
    </div>
  );
}
```

### useGSAP Configuration Options

```tsx
// Full config object (maximum flexibility)
useGSAP(() => {
  gsap.to('.box', { x: endX });
}, {
  dependencies: [endX],       // re-run when endX changes
  scope: containerRef,         // scope selectors to container
  revertOnUpdate: true,        // revert animations when deps change (not just unmount)
});

// Simple dependency array (like useEffect)
useGSAP(() => {
  gsap.to('.box', { x: endX });
}, [endX]);

// No dependencies (run once on mount)
useGSAP(() => {
  gsap.to('.box', { x: 360 });
});
```

### Context-Safe Event Handlers

Animations created AFTER the useGSAP hook executes (click handlers, setTimeout, etc.) are NOT automatically tracked. Wrap them with `contextSafe`:

```tsx
'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function ClickAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP({ scope: containerRef });

  // This animation IS tracked and will be cleaned up on unmount
  const handleClick = contextSafe(() => {
    gsap.to('.box', { rotation: '+=180', duration: 0.6 });
  });

  return (
    <div ref={containerRef}>
      <button onClick={handleClick}>
        <div className="box">Click me</div>
      </button>
    </div>
  );
}
```

### Alternative: contextSafe inside the hook

```tsx
useGSAP((context, contextSafe) => {
  // Direct animations (automatically tracked)
  gsap.to('.box', { x: 100 });

  // Event handler animations (manually wrapped)
  const onClick = contextSafe(() => {
    gsap.to('.box', { rotation: 180 });
  });

  document.querySelector('.trigger')?.addEventListener('click', onClick);

  // Manual cleanup for event listeners
  return () => {
    document.querySelector('.trigger')?.removeEventListener('click', onClick);
  };
}, { scope: containerRef });
```

### Plugin Registration Pattern

Register all plugins once in a shared file or at the top of your layout:

```tsx
// lib/gsap-config.ts
'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export { gsap, ScrollTrigger, SplitText, useGSAP };
```

Then import from this file throughout the project:

```tsx
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap-config';
```

---

## 2. ScrollTrigger Basics and Advanced Patterns

### Core Configuration Properties

```tsx
ScrollTrigger.create({
  trigger: '.section',          // element that triggers the animation
  start: 'top center',         // "trigger viewport" - when trigger's top hits viewport center
  end: 'bottom top',           // when trigger's bottom hits viewport top
  scrub: true,                 // link animation to scroll position (true = instant, number = seconds delay)
  pin: true,                   // pin trigger element during scroll
  pinSpacing: true,            // add spacing to maintain layout (true | false | "margin")
  anticipatePin: 1,            // pre-apply pin to avoid flash (0-1)
  markers: true,               // DEV ONLY: show start/end markers
  toggleActions: 'play none none none', // onEnter onLeave onEnterBack onLeaveBack
  snap: 0.5,                   // snap to progress values
  once: false,                 // kill after first activation
  toggleClass: 'active',       // add/remove class when active
});
```

### Start/End Position Syntax

```
start: "top center"      // trigger's top hits viewport center
start: "top top"         // trigger's top hits viewport top (for pinning)
start: "top 80%"         // trigger's top hits 80% from viewport top
start: "center center"   // trigger's center hits viewport center
end: "bottom top"        // trigger's bottom hits viewport top
end: "+=500"             // 500px after start
end: () => "+=" + document.querySelector('.panel').offsetWidth  // dynamic
```

### Scrub Behavior

```tsx
// Direct link (instant, can feel jerky)
scrub: true

// Smoothed catch-up (recommended for most cases)
scrub: 1    // 1 second to "catch up" to scroll position

// Longer catch-up for dreamy feel
scrub: 3    // 3 seconds - good for parallax/ambient

// For Rick's Cafe timeline, use scrub: 1 for responsive feel
```

### Snap Configuration

```tsx
// Snap to every 25%
snap: 0.25

// Snap to specific progress values
snap: [0, 0.25, 0.5, 0.75, 1]

// Snap to timeline labels
snap: "labels"

// Advanced snap with easing
snap: {
  snapTo: 0.25,
  duration: { min: 0.2, max: 0.6 },
  delay: 0.1,
  ease: 'power1.inOut',
}

// Snap to meal nodes (for Rick's Cafe timeline)
snap: {
  snapTo: 1 / (mealNodes.length - 1),
  duration: { min: 0.3, max: 0.8 },
  ease: 'power2.inOut',
}
```

### Callback Functions

```tsx
ScrollTrigger.create({
  trigger: '.section',
  start: 'top center',
  end: 'bottom center',
  onEnter: (self) => console.log('entered'),
  onLeave: (self) => console.log('left'),
  onEnterBack: (self) => console.log('entered going back'),
  onLeaveBack: (self) => console.log('left going back'),
  onUpdate: (self) => {
    console.log('progress:', self.progress.toFixed(2)); // 0 to 1
    console.log('direction:', self.direction);           // 1 or -1
    console.log('velocity:', self.getVelocity());        // px/sec
  },
  onRefresh: (self) => console.log('recalculated positions'),
  onToggle: (self) => console.log('active:', self.isActive),
});
```

### Batch Animations (Staggered Reveals)

```tsx
// Animate meal cards as they enter the viewport
ScrollTrigger.batch('.meal-card', {
  onEnter: (batch) => {
    gsap.to(batch, {
      opacity: 1,
      y: 0,
      stagger: 0.15,
      duration: 0.8,
      ease: 'power3.out',
    });
  },
  onLeaveBack: (batch) => {
    gsap.to(batch, {
      opacity: 0,
      y: 50,
      stagger: 0.1,
    });
  },
  start: 'top 85%',
});
```

---

## 3. Timeline Animation Implementation

### Basic Scroll-Driven Timeline

```tsx
'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap-config';

export default function MealTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=3000',          // 3000px of scroll distance
        scrub: 1,               // smooth 1-second catch-up
        pin: true,              // pin container during scroll
        anticipatePin: 1,
      },
    });

    // Durations are PROPORTIONAL when scrubbed (not seconds)
    // Total duration = 6, so each 1 = 1/6th of scroll distance
    tl.to('.meal-1', { opacity: 1, y: 0, duration: 1 })
      .to('.meal-1-details', { opacity: 1, x: 0, duration: 0.5 })
      .to('.meal-1', { opacity: 0, duration: 0.5 })
      .to('.meal-2', { opacity: 1, y: 0, duration: 1 })
      .to('.meal-2-details', { opacity: 1, x: 0, duration: 0.5 })
      .to('.meal-2', { opacity: 0, duration: 0.5 })
      .to('.meal-3', { opacity: 1, y: 0, duration: 1 })
      .to('.meal-3-details', { opacity: 1, x: 0, duration: 1 });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative h-screen overflow-hidden">
      {/* Meal nodes positioned absolutely */}
      <div className="meal-1 opacity-0 translate-y-20">Antipasti</div>
      <div className="meal-1-details opacity-0 translate-x-10">...</div>
      <div className="meal-2 opacity-0 translate-y-20">Primi</div>
      <div className="meal-2-details opacity-0 translate-x-10">...</div>
      <div className="meal-3 opacity-0 translate-y-20">Secondi</div>
      <div className="meal-3-details opacity-0 translate-x-10">...</div>
    </div>
  );
}
```

### Timeline with Labels (for Snapping to Meal Nodes)

```tsx
useGSAP(() => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: containerRef.current,
      start: 'top top',
      end: '+=5000',
      scrub: 1,
      pin: true,
      snap: {
        snapTo: 'labels',
        duration: { min: 0.3, max: 0.8 },
        ease: 'power2.inOut',
      },
    },
  });

  tl.addLabel('antipasti')
    .to('.node-antipasti', { opacity: 1, scale: 1, duration: 1 })
    .to('.line-1', { scaleX: 1, duration: 0.5 })
    .addLabel('primi')
    .to('.node-primi', { opacity: 1, scale: 1, duration: 1 })
    .to('.line-2', { scaleX: 1, duration: 0.5 })
    .addLabel('secondi')
    .to('.node-secondi', { opacity: 1, scale: 1, duration: 1 })
    .to('.line-3', { scaleX: 1, duration: 0.5 })
    .addLabel('dolci')
    .to('.node-dolci', { opacity: 1, scale: 1, duration: 1 });

}, { scope: containerRef });
```

### Timeline Position Parameters

```tsx
// Position parameter controls timing within timeline
tl.to('.a', { x: 100, duration: 1 })           // starts at end of previous
  .to('.b', { y: 50, duration: 0.5 }, '<')      // starts at SAME time as previous
  .to('.c', { opacity: 1, duration: 1 }, '<0.2') // 0.2s after previous starts
  .to('.d', { scale: 1.2, duration: 0.5 }, '>') // starts at END of previous (default)
  .to('.e', { rotation: 90, duration: 1 }, 2)    // starts at absolute time 2s
  .to('.f', { x: -100, duration: 1 }, '-=0.5')   // 0.5s BEFORE end of timeline
  .to('.g', { y: -50, duration: 1 }, '+=0.3');    // 0.3s AFTER end of timeline
```

### Progress-Based Scroll Indicator

```tsx
useGSAP(() => {
  // Progress bar that fills as user scrolls through timeline
  gsap.to('.timeline-progress-bar', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.3,
    },
  });

  // Active node indicator based on scroll progress
  ScrollTrigger.create({
    trigger: containerRef.current,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const progress = self.progress;
      const activeIndex = Math.round(progress * (mealNodes.length - 1));
      setActiveNode(activeIndex); // React state for active meal node
    },
  });
}, { scope: containerRef });
```

---

## 4. Horizontal Scroll Section

### Core Pattern: Vertical Scroll Drives Horizontal Movement

```tsx
'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap-config';

interface MealNode {
  id: string;
  title: string;
  image: string;
}

export default function HorizontalTimeline({ meals }: { meals: MealNode[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const track = trackRef.current;
    if (!track) return;

    const cards = gsap.utils.toArray<HTMLElement>('.meal-card');

    // Animate the track to the left by (total width - one viewport width)
    gsap.to(track, {
      xPercent: -100 * (cards.length - 1) / cards.length * 100 / 100,
      // Simpler: use x with pixel calculation
      x: () => -(track.scrollWidth - window.innerWidth),
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        pin: true,
        anticipatePin: 1,
        scrub: 1,
        start: 'top top',
        end: () => '+=' + (track.scrollWidth - window.innerWidth),
        invalidateOnRefresh: true, // recalculate on resize
      },
    });

    // Individual card entrance animations within horizontal scroll
    cards.forEach((card, i) => {
      gsap.from(card.querySelector('.card-content'), {
        opacity: 0,
        y: 60,
        scrollTrigger: {
          trigger: card,
          containerAnimation: gsap.getById('horizontal-scroll'), // IMPORTANT
          start: 'left 80%',
          end: 'left 30%',
          scrub: true,
        },
      });
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      <div
        ref={trackRef}
        className="flex"
        style={{ width: `${meals.length * 100}vw` }}
      >
        {meals.map((meal) => (
          <div
            key={meal.id}
            className="meal-card w-screen h-screen flex items-center justify-center flex-shrink-0"
          >
            <div className="card-content">
              <h2>{meal.title}</h2>
              <img src={meal.image} alt={meal.title} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

### Cleaner xPercent Approach

```tsx
useGSAP(() => {
  const cards = gsap.utils.toArray<HTMLElement>('.meal-card');

  gsap.to(cards, {
    xPercent: -100 * (cards.length - 1),
    ease: 'none',
    scrollTrigger: {
      trigger: sectionRef.current,
      pin: true,
      scrub: 1,
      snap: 1 / (cards.length - 1),     // snap to each card
      end: () => '+=' + sectionRef.current!.offsetWidth,
      invalidateOnRefresh: true,
    },
  });
}, { scope: sectionRef });
```

### Horizontal Scroll with Nested Animations (containerAnimation)

When you have a horizontal scroll AND want to trigger animations within it based on horizontal position, use `containerAnimation`:

```tsx
useGSAP(() => {
  const track = trackRef.current!;

  // The main horizontal scroll tween
  const horizontalTween = gsap.to(track, {
    x: () => -(track.scrollWidth - window.innerWidth),
    ease: 'none',
    scrollTrigger: {
      trigger: sectionRef.current,
      pin: true,
      scrub: 1,
      end: () => '+=' + track.scrollWidth,
      invalidateOnRefresh: true,
    },
  });

  // Animations WITHIN the horizontal scroll
  gsap.utils.toArray<HTMLElement>('.meal-node').forEach((node) => {
    gsap.from(node, {
      opacity: 0,
      scale: 0.5,
      duration: 1,
      scrollTrigger: {
        trigger: node,
        containerAnimation: horizontalTween,  // KEY: tells ScrollTrigger about horizontal context
        start: 'left 75%',                    // use left/right instead of top/bottom
        end: 'left 25%',
        scrub: true,
      },
    });
  });
}, { scope: sectionRef });
```

### CSS for Horizontal Section

```css
/* The section takes full viewport height and clips overflow */
.horizontal-section {
  position: relative;
  overflow: hidden;
}

/* The track is a flex row, each child is viewport-width */
.horizontal-track {
  display: flex;
  flex-wrap: nowrap;
}

.meal-card {
  flex-shrink: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## 5. Lenis Setup and Configuration

### Installation

```bash
npm install lenis
```

**Important:** The package was renamed. Do NOT use the deprecated `@studio-freight/lenis` or `@studio-freight/react-lenis`. Use `lenis` directly.

### Option A: ReactLenis Component (Simple)

```tsx
// components/SmoothScroll.tsx
'use client';

import { ReactLenis } from 'lenis/react';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,           // interpolation (0.05 = very smooth, 0.15 = snappier)
        duration: 1.2,        // scroll duration in seconds
        smoothWheel: true,    // smooth wheel scrolling
        syncTouch: false,     // disable for better mobile perf
        touchMultiplier: 2,   // touch sensitivity
        infinite: false,      // no infinite scroll
        autoRaf: true,        // automatic animation frame loop
      }}
    >
      {children}
    </ReactLenis>
  );
}
```

Layout integration:

```tsx
// app/layout.tsx
import SmoothScroll from '@/components/SmoothScroll';
import 'lenis/dist/lenis.css';  // Required CSS

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
```

### Option B: Custom Provider (More Control)

This approach gives you access to the Lenis instance throughout your app:

```tsx
// components/providers/lenis-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import Lenis from 'lenis';
import type { LenisOptions } from 'lenis';

const LenisContext = createContext<Lenis | null>(null);

export function LenisProvider({
  children,
  options = {},
}: {
  children: React.ReactNode;
  options?: LenisOptions;
}) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const lenisInstance = new Lenis({
      autoRaf: true,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 2,
      infinite: false,
      anchors: true,
      ...optionsRef.current,
    });

    setLenis(lenisInstance);

    return () => {
      lenisInstance.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}

export function useLenisInstance() {
  const context = useContext(LenisContext);
  if (context === undefined) {
    throw new Error('useLenisInstance must be used within a LenisProvider');
  }
  return context;
}
```

### Lenis Configuration Reference

| Option | Type | Default | Notes |
|--------|------|---------|-------|
| `lerp` | number | 0.1 | Interpolation (0.05 = silky, 0.15 = snappy) |
| `duration` | number | 1.2 | Scroll animation duration (seconds) |
| `smoothWheel` | boolean | true | Smooth mouse wheel scrolling |
| `syncTouch` | boolean | false | Smooth touch scrolling (disable for perf) |
| `touchMultiplier` | number | 1 | Touch gesture sensitivity |
| `wheelMultiplier` | number | 1 | Mouse wheel sensitivity |
| `orientation` | string | 'vertical' | 'vertical' or 'horizontal' |
| `infinite` | boolean | false | Infinite scrolling |
| `autoRaf` | boolean | false | Automatic RAF loop |
| `easing` | function | exponential | Easing curve for scroll |
| `anchors` | boolean | false | Handle anchor links |
| `autoResize` | boolean | true | ResizeObserver auto-resize |
| `prevent` | function | undefined | Custom scroll prevention |

### Useful Lenis Properties

```tsx
const lenis = useLenisInstance();

lenis.animatedScroll  // current interpolated scroll position
lenis.targetScroll    // target scroll destination
lenis.velocity        // current scroll velocity
lenis.direction       // 1 (down/right) or -1 (up/left)
lenis.progress        // 0 to 1 scroll progress
lenis.isScrolling     // true | 'smooth' | 'native' | false
```

### Programmatic Scroll

```tsx
const lenis = useLenisInstance();

// Scroll to element
lenis?.scrollTo('#meal-section', { duration: 2, easing: (t) => 1 - Math.pow(1 - t, 3) });

// Scroll to position
lenis?.scrollTo(500, { immediate: true });

// Scroll to top
lenis?.scrollTo('top');

// Stop/start scrolling (useful for modals)
lenis?.stop();
lenis?.start();
```

### Preventing Scroll on Specific Elements

```html
<!-- Prevent Lenis smooth scroll on modals, dropdowns, etc. -->
<div data-lenis-prevent>
  This area uses native scroll
</div>

<!-- Prevent only wheel events -->
<div data-lenis-prevent-wheel>...</div>

<!-- Prevent only touch events -->
<div data-lenis-prevent-touch>...</div>
```

Or via JavaScript:

```tsx
const lenis = new Lenis({
  prevent: (node) => {
    return node.classList.contains('modal-content') || node.id === 'dropdown';
  },
});
```

### Lenis Known Limitations

- CSS `scroll-snap` is NOT supported (use `lenis/snap` package instead).
- Capped at 60fps on Safari; 30fps in low-power mode.
- Does not work over iframes.
- `position: fixed` may lag on pre-M1 MacOS Safari.
- Touch can be unpredictable on iOS < 16 with `syncTouch` enabled.

---

## 6. Lenis + GSAP ScrollTrigger Integration

This is the critical integration pattern. Lenis handles smooth scrolling; GSAP ScrollTrigger handles scroll-driven animations. They must be synchronized.

### Pattern A: Using ReactLenis (Simpler)

When using `<ReactLenis root>`, disable Lenis's `autoRaf` and let GSAP's ticker drive both:

```tsx
// components/SmoothScroll.tsx
'use client';

import { useEffect, useRef } from 'react';
import { ReactLenis, useLenis } from 'lenis/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function ScrollSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    // 1. Sync Lenis scroll events to ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // 2. Drive Lenis RAF from GSAP's ticker (single animation loop)
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000); // GSAP gives seconds, Lenis wants milliseconds
    };
    gsap.ticker.add(tickerCallback);

    // 3. Disable GSAP lag smoothing (Lenis handles smoothing)
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off('scroll', ScrollTrigger.update);
      gsap.ticker.remove(tickerCallback);
    };
  }, [lenis]);

  return null;
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        syncTouch: false,
        autoRaf: false,  // IMPORTANT: Let GSAP ticker drive the RAF
      }}
    >
      <ScrollSync />
      {children}
    </ReactLenis>
  );
}
```

### Pattern B: Using Custom Provider (More Control)

```tsx
// components/providers/scroll-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ScrollContext = createContext<Lenis | null>(null);

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const lenisInstance = new Lenis({
      duration: 1.2,
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false, // GSAP ticker drives RAF
    });

    // Sync Lenis -> ScrollTrigger
    lenisInstance.on('scroll', ScrollTrigger.update);

    // GSAP ticker drives Lenis
    const tickerCallback = (time: number) => {
      lenisInstance.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    setLenis(lenisInstance);

    return () => {
      lenisInstance.off('scroll', ScrollTrigger.update);
      gsap.ticker.remove(tickerCallback);
      lenisInstance.destroy();
    };
  }, []);

  return (
    <ScrollContext.Provider value={lenis}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScroll() {
  return useContext(ScrollContext);
}
```

### Integration Checklist

1. `autoRaf: false` on Lenis (GSAP ticker handles timing).
2. `lenis.on('scroll', ScrollTrigger.update)` syncs scroll position.
3. `gsap.ticker.add((time) => lenis.raf(time * 1000))` unifies animation loop.
4. `gsap.ticker.lagSmoothing(0)` prevents GSAP from fighting Lenis smoothing.
5. Clean up all three connections on unmount.

### Why Not Use GSAP ScrollSmoother Instead?

GSAP has its own `ScrollSmoother` plugin (now free). You could use it instead of Lenis. Trade-offs:

| | Lenis | ScrollSmoother |
|---|---|---|
| **Size** | ~4KB | Included in GSAP |
| **Integration** | Needs manual sync | Native ScrollTrigger integration |
| **DOM structure** | No wrapper needed | Requires `#smooth-wrapper` > `#smooth-content` |
| **Community** | Very popular, MIT license | GSAP ecosystem |
| **Control** | More manual control | Tighter GSAP integration |

For Rick's Cafe, **Lenis is recommended** because it does not require DOM restructuring and has broader community support for custom smooth-scroll patterns.

---

## 7. Pin/Unpin Sections Pattern

### Basic Pinned Section

```tsx
'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap-config';

export default function PinnedMealReveal() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: sectionRef.current,
      pin: true,                    // pin this section
      start: 'top top',            // when section top hits viewport top
      end: '+=600',                // stay pinned for 600px of scroll
      pinSpacing: true,            // add space below so content flows naturally
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="h-screen flex items-center justify-center">
      <h2>This section stays pinned while you scroll</h2>
    </section>
  );
}
```

### Pinned Section with Animation

**Important:** Do NOT animate the pinned element itself. Animate children inside it.

```tsx
useGSAP(() => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: sectionRef.current,
      pin: true,
      start: 'top top',
      end: '+=2000',
      scrub: 1,
    },
  });

  // Animate CHILDREN of the pinned section, not the section itself
  tl.from('.meal-image', { scale: 0.5, opacity: 0, duration: 1 })
    .from('.meal-title', { y: 100, opacity: 0, duration: 0.5 }, '-=0.3')
    .from('.meal-description', { y: 50, opacity: 0, duration: 0.5 }, '-=0.2')
    .to('.meal-image', { scale: 1.1, duration: 1 }, '+=0.5')
    .to('.meal-content', { opacity: 0, y: -50, duration: 0.5 });

}, { scope: sectionRef });
```

### Stacked Pinned Sections (Layered Reveal)

Each section pins and covers the previous one, like stacked cards:

```tsx
useGSAP(() => {
  const sections = gsap.utils.toArray<HTMLElement>('.meal-panel');

  sections.forEach((section, i) => {
    ScrollTrigger.create({
      trigger: section,
      pin: true,
      start: 'top top',
      end: '+=100%',
      pinSpacing: i < sections.length - 1 ? false : true, // only last gets spacing
    });

    // Animate each section's content
    gsap.from(section.querySelector('.content'), {
      opacity: 0,
      y: 80,
      scrollTrigger: {
        trigger: section,
        start: 'top 60%',
        end: 'top 20%',
        scrub: true,
      },
    });
  });
}, { scope: containerRef });
```

### Pin with anticipatePin

```tsx
ScrollTrigger.create({
  trigger: '.panel',
  pin: true,
  start: 'top top',
  end: '+=500',
  anticipatePin: 1, // pre-applies pin to prevent flash/jump when section sticks
});
```

---

## 8. Custom Cursor Implementation

### Smooth Following Cursor with GSAP

```tsx
// components/CustomCursor.tsx
'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    // quickTo creates optimized, reusable animation targets
    const xCursor = gsap.quickTo(cursor, 'x', { duration: 0.2, ease: 'power3.out' });
    const yCursor = gsap.quickTo(cursor, 'y', { duration: 0.2, ease: 'power3.out' });
    const xFollower = gsap.quickTo(follower, 'x', { duration: 0.6, ease: 'power3.out' });
    const yFollower = gsap.quickTo(follower, 'y', { duration: 0.6, ease: 'power3.out' });

    const handleMouseMove = (e: MouseEvent) => {
      xCursor(e.clientX);
      yCursor(e.clientY);
      xFollower(e.clientX);
      yFollower(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <>
      {/* Small dot cursor */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999]"
        style={{ transform: 'translate(-50%, -50%)' }}
      />
      {/* Larger follower ring */}
      <div
        ref={followerRef}
        className="fixed top-0 left-0 w-10 h-10 border border-white/50 rounded-full pointer-events-none z-[9998]"
        style={{ transform: 'translate(-50%, -50%)' }}
      />
    </>
  );
}
```

### Blend Mode Cursor (Inverts Colors)

```tsx
// components/BlendCursor.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

export default function BlendCursor() {
  const circleRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const delayedMouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const [isHovering, setIsHovering] = useState(false);

  const size = isHovering ? 400 : 30;

  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) =>
      start * (1 - factor) + end * factor;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      const { x, y } = delayedMouseRef.current;
      delayedMouseRef.current = {
        x: lerp(x, mouseRef.current.x, 0.075),
        y: lerp(y, mouseRef.current.y, 0.075),
      };

      gsap.set(circleRef.current, {
        x: delayedMouseRef.current.x,
        y: delayedMouseRef.current.y,
        xPercent: -50,
        yPercent: -50,
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={circleRef}
      style={{
        width: size,
        height: size,
        filter: `blur(${isHovering ? 30 : 0}px)`,
        transition: 'width 0.3s ease-out, height 0.3s ease-out, filter 0.3s ease-out',
      }}
      className="fixed top-0 left-0 rounded-full bg-[#BCE4F2] mix-blend-difference pointer-events-none z-[9999]"
    />
  );
}
```

### Cursor State Changes on Hover

```tsx
// Hook to manage cursor state across the app
// components/hooks/useCursorState.ts
'use client';

import { create } from 'zustand';

interface CursorState {
  variant: 'default' | 'hover' | 'view' | 'drag';
  text: string;
  setVariant: (variant: CursorState['variant']) => void;
  setText: (text: string) => void;
}

export const useCursorState = create<CursorState>((set) => ({
  variant: 'default',
  text: '',
  setVariant: (variant) => set({ variant }),
  setText: (text) => set({ text }),
}));
```

```tsx
// In your cursor component, react to state changes
useEffect(() => {
  const cursor = cursorRef.current;
  if (!cursor) return;

  switch (variant) {
    case 'hover':
      gsap.to(cursor, { scale: 2.5, duration: 0.3, ease: 'power2.out' });
      break;
    case 'view':
      gsap.to(cursor, { scale: 4, duration: 0.3, ease: 'power2.out' });
      break;
    case 'drag':
      gsap.to(cursor, { scale: 0.5, duration: 0.2, ease: 'power2.out' });
      break;
    default:
      gsap.to(cursor, { scale: 1, duration: 0.3, ease: 'power2.out' });
  }
}, [variant]);
```

### Usage in Interactive Elements

```tsx
import { useCursorState } from '@/components/hooks/useCursorState';

export default function MealCard({ meal }) {
  const { setVariant } = useCursorState();

  return (
    <div
      onMouseEnter={() => setVariant('view')}
      onMouseLeave={() => setVariant('default')}
      className="meal-card"
    >
      <img src={meal.image} alt={meal.title} />
      <h3>{meal.title}</h3>
    </div>
  );
}
```

---

## 9. Magnetic Cursor Effect

### Magnetic Button Component (GSAP)

Elements that "pull" toward the cursor when nearby:

```tsx
// components/MagneticElement.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface MagneticElementProps {
  children: React.ReactElement;
  strength?: number;   // 1 = full magnetic pull, 0.5 = half
  radius?: number;     // not used in this version, but you could add proximity detection
}

export default function MagneticElement({
  children,
  strength = 1,
}: MagneticElementProps) {
  const magneticRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = magneticRef.current;
    if (!el) return;

    // quickTo with elastic easing for springy feel
    const xTo = gsap.quickTo(el, 'x', {
      duration: 1,
      ease: 'elastic.out(1, 0.3)',
    });
    const yTo = gsap.quickTo(el, 'y', {
      duration: 1,
      ease: 'elastic.out(1, 0.3)',
    });

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { height, width, left, top } = el.getBoundingClientRect();
      const x = (clientX - (left + width / 2)) * strength;
      const y = (clientY - (top + height / 2)) * strength;
      xTo(x);
      yTo(y);
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  // Clone the child element and attach the ref
  return React.cloneElement(children, { ref: magneticRef });
}
```

### Usage

```tsx
<MagneticElement strength={0.4}>
  <button className="px-8 py-4 bg-amber-800 text-white rounded-full">
    View Menu
  </button>
</MagneticElement>

<MagneticElement strength={0.6}>
  <a href="#reservations" className="text-lg underline">
    Reserve a Table
  </a>
</MagneticElement>
```

### Advanced: Magnetic Effect with Proximity Detection

Only activate the magnetic effect when cursor is within a certain radius:

```tsx
'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

interface ProximityMagneticProps {
  children: React.ReactElement;
  strength?: number;
  proximity?: number;  // pixel radius for activation
}

export default function ProximityMagnetic({
  children,
  strength = 0.5,
  proximity = 100,
}: ProximityMagneticProps) {
  const elementRef = useRef<HTMLElement>(null);
  const isActiveRef = useRef(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' });

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distance = Math.sqrt(
        Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)
      );

      if (distance < proximity) {
        isActiveRef.current = true;
        const x = (clientX - centerX) * strength;
        const y = (clientY - centerY) * strength;
        xTo(x);
        yTo(y);

        // Scale up slightly when in proximity
        gsap.to(el, { scale: 1.05, duration: 0.3 });
      } else if (isActiveRef.current) {
        isActiveRef.current = false;
        xTo(0);
        yTo(0);
        gsap.to(el, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [strength, proximity]);

  return React.cloneElement(children, { ref: elementRef });
}
```

### Magnetic Cursor + Custom Cursor Together

When using both a custom cursor AND magnetic elements, coordinate them:

```tsx
// In your cursor component, expand on hover over magnetic elements
useEffect(() => {
  const magneticElements = document.querySelectorAll('[data-magnetic]');

  magneticElements.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      gsap.to(followerRef.current, {
        scale: 3,
        borderColor: 'rgba(255, 182, 72, 0.8)',
        duration: 0.3,
      });
    });

    el.addEventListener('mouseleave', () => {
      gsap.to(followerRef.current, {
        scale: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        duration: 0.3,
      });
    });
  });
}, []);
```

---

## 10. GSAP + Framer Motion Coexistence

### When to Use Which

| Use Case | Library | Why |
|----------|---------|-----|
| Scroll-driven animations | **GSAP** | ScrollTrigger is unmatched for scroll-linked timelines |
| Horizontal scroll sections | **GSAP** | Requires pinning and scrub control |
| Page transitions | **Framer Motion** | `AnimatePresence` handles mount/unmount naturally |
| Layout animations | **Framer Motion** | `layout` prop auto-animates layout changes |
| Hover/tap micro-interactions | **Framer Motion** | Declarative `whileHover`, `whileTap` |
| SVG morphing | **GSAP** | MorphSVG plugin |
| Text splitting/animation | **GSAP** | SplitText plugin |
| Timeline orchestration | **GSAP** | Precise control with labels, position params |
| Drag gestures | **Framer Motion** | `drag` prop with constraints |
| Complex path animations | **GSAP** | MotionPath plugin |
| Component entrance animations | **Either** | FM for simple, GSAP for scroll-triggered |
| Cursor animations | **GSAP** | quickTo for performant position updates |
| Modal/sheet animations | **Framer Motion** | AnimatePresence for mount/unmount |
| Stagger animations | **Both** | FM variants or GSAP stagger |
| Parallax | **GSAP** | ScrollTrigger scrub |

### Architecture Strategy for Rick's Cafe

```
Framer Motion handles:
  - Page transitions (AnimatePresence in layout)
  - Modal/sheet open-close
  - Menu item hover states (whileHover)
  - Card layout animations (layout prop)
  - Drag-to-dismiss gestures
  - Component mount/unmount animations

GSAP handles:
  - Scroll-driven meal timeline
  - Horizontal scroll sections
  - Pinned reveal sections
  - Custom cursor animation
  - Magnetic cursor effects
  - Text reveal animations (SplitText)
  - Parallax background effects
  - Progress indicators tied to scroll
```

### Coexistence Rules

1. **Never animate the same property with both libraries simultaneously.** If GSAP is animating `transform` on an element, do not also use Framer Motion's `animate` prop on the same element's transform.

2. **Use refs for GSAP, props for Framer Motion.** GSAP operates imperatively via refs. Framer Motion operates declaratively via component props. Keep them on different elements or different properties.

3. **Separate concerns by component.** A component should use one or the other, not both, unless properties do not overlap.

### Example: Mixed Component

```tsx
'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function MealCard({ meal, index }: { meal: Meal; index: number }) {
  const imageRef = useRef<HTMLImageElement>(null);

  // GSAP: Scroll-triggered parallax on the image
  useGSAP(() => {
    gsap.to(imageRef.current, {
      y: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: imageRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });

  return (
    // Framer Motion: Layout animation and hover effect on the card
    <motion.div
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      className="meal-card overflow-hidden rounded-lg"
    >
      {/* GSAP controls this element's transform via ref (parallax) */}
      <img
        ref={imageRef}
        src={meal.image}
        alt={meal.title}
        className="w-full h-64 object-cover"
      />
      {/* Framer Motion controls this element (layout animation) */}
      <motion.div layout className="p-4">
        <h3>{meal.title}</h3>
        <p>{meal.description}</p>
      </motion.div>
    </motion.div>
  );
}
```

### Bundle Optimization

Import only what you need:

```tsx
// GSAP: Import specific modules
import gsap from 'gsap';                        // ~23KB gzipped
import { ScrollTrigger } from 'gsap/ScrollTrigger'; // additional ~7KB
import { SplitText } from 'gsap/SplitText';         // additional ~4KB

// Framer Motion: Tree-shakeable since v11
import { motion, AnimatePresence } from 'framer-motion'; // ~32KB base
// Or use the renamed package:
import { motion, AnimatePresence } from 'motion/react';
```

---

## 11. Cleanup and Memory Management

### useGSAP Automatic Cleanup

Everything created inside `useGSAP()` is automatically reverted on unmount:

```tsx
useGSAP(() => {
  // These are ALL automatically cleaned up:
  gsap.to('.box', { x: 100 });
  gsap.timeline().to('.a', { y: 50 }).to('.b', { opacity: 0 });
  ScrollTrigger.create({ trigger: '.section', pin: true });
}, { scope: containerRef });
// No manual cleanup needed for the above
```

### Manual Cleanup for Event Handlers

```tsx
useGSAP((context, contextSafe) => {
  const handleClick = contextSafe(() => {
    gsap.to('.box', { rotation: 180 });
  });

  const button = document.querySelector('.trigger-btn');
  button?.addEventListener('click', handleClick);

  // Return cleanup function for event listeners
  return () => {
    button?.removeEventListener('click', handleClick);
  };
}, { scope: containerRef });
```

### revertOnUpdate for Dynamic Content

```tsx
// When dependencies change, ALL animations are reverted and re-created
useGSAP(() => {
  gsap.to('.box', { x: endX });
}, {
  dependencies: [endX],
  scope: containerRef,
  revertOnUpdate: true, // revert on EVERY dependency change, not just unmount
});
```

### Lenis Cleanup

```tsx
useEffect(() => {
  const lenis = new Lenis({ /* options */ });

  return () => {
    lenis.destroy(); // removes all event listeners and RAF
  };
}, []);
```

### ScrollTrigger.refresh()

Call after all animations are set up (especially after dynamic content loads):

```tsx
useGSAP(() => {
  // ... set up all ScrollTriggers ...

  // Recalculate all start/end positions after layout settles
  ScrollTrigger.refresh();
}, { scope: containerRef });
```

For dynamic content (images loading, fonts rendering):

```tsx
useEffect(() => {
  // Refresh after images load
  const images = document.querySelectorAll('img');
  let loaded = 0;

  images.forEach((img) => {
    if (img.complete) {
      loaded++;
    } else {
      img.addEventListener('load', () => {
        loaded++;
        if (loaded === images.length) {
          ScrollTrigger.refresh();
        }
      });
    }
  });

  if (loaded === images.length) {
    ScrollTrigger.refresh();
  }
}, []);
```

### Common Cleanup Pitfalls

```tsx
// BAD: Animations inside setTimeout are NOT tracked by useGSAP
useGSAP(() => {
  setTimeout(() => {
    gsap.to('.box', { x: 100 }); // This will NOT be cleaned up automatically
  }, 1000);
});

// GOOD: Use contextSafe for delayed animations
useGSAP((context, contextSafe) => {
  const delayedAnimation = contextSafe(() => {
    gsap.to('.box', { x: 100 });
  });

  setTimeout(delayedAnimation, 1000);
});

// GOOD: Or use GSAP's built-in delay
useGSAP(() => {
  gsap.to('.box', { x: 100, delay: 1 }); // Tracked automatically
});
```

---

## 12. Performance Optimization

### GPU-Accelerated Properties

GSAP automatically uses `translate3d()` to activate GPU acceleration. Stick to these properties for best performance:

```tsx
// FAST (GPU-composited, no layout recalculation)
gsap.to(el, {
  x: 100,          // translateX
  y: 50,           // translateY
  rotation: 45,    // rotate
  scale: 1.2,      // scale
  opacity: 0.5,    // opacity
});

// SLOW (triggers layout recalculation)
gsap.to(el, {
  left: '100px',   // AVOID: causes reflow
  top: '50px',     // AVOID: causes reflow
  width: '200px',  // AVOID: causes reflow
  height: '200px', // AVOID: causes reflow
});
```

### will-change Optimization

Apply sparingly to elements that will be animated:

```css
/* Apply ONLY to elements that will animate */
.will-animate {
  will-change: transform, opacity;
}

/* Remove after animation completes for elements that stop animating */
```

Or with GSAP:

```tsx
gsap.set('.animated-element', { willChange: 'transform' });
// After animation:
gsap.set('.animated-element', { willChange: 'auto' });
```

### Reduce ScrollTrigger Overhead

```tsx
// Use fastScrollEnd to quickly settle ScrollTrigger calculations
ScrollTrigger.config({
  limitCallbacks: true,    // only fire callbacks when active
  ignoreMobileResize: true, // ignore mobile address bar resize
});

// Batch ScrollTrigger refreshes
ScrollTrigger.addEventListener('refreshInit', () => {
  // Runs before all ScrollTriggers recalculate
});
```

### Lazy Registration

Only register plugins you actually use:

```tsx
// In components that use ScrollTrigger
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// In components that use SplitText
import { SplitText } from 'gsap/SplitText';
gsap.registerPlugin(SplitText);

// Do NOT import everything everywhere
```

### Lenis Performance Tips

```tsx
const lenis = new Lenis({
  syncTouch: false,       // Disable for mobile performance
  wheelMultiplier: 1,     // Don't amplify wheel events
  touchMultiplier: 2,     // Reasonable touch sensitivity
  lerp: 0.1,             // Not too low (causes unnecessary frames)
});
```

### Accessibility: Respect prefers-reduced-motion

```tsx
useGSAP(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Disable scroll animations, show content immediately
    gsap.set('.animated', { opacity: 1, y: 0, x: 0 });
    return;
  }

  // Normal animation setup
  gsap.to('.animated', {
    opacity: 1,
    y: 0,
    scrollTrigger: { /* ... */ },
  });
});
```

For Lenis:

```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const lenis = new Lenis({
  lerp: prefersReducedMotion ? 1 : 0.1,      // instant scroll if reduced motion
  duration: prefersReducedMotion ? 0 : 1.2,
});
```

### Mobile Considerations

```tsx
useGSAP(() => {
  const isMobile = window.innerWidth < 768;

  ScrollTrigger.matchMedia({
    '(min-width: 768px)': function () {
      // Desktop-only animations (horizontal scroll, complex timelines)
      gsap.to('.track', {
        x: () => -(track.scrollWidth - window.innerWidth),
        scrollTrigger: { trigger: '.section', pin: true, scrub: 1 },
      });
    },
    '(max-width: 767px)': function () {
      // Simpler mobile animations (vertical, lighter)
      gsap.from('.card', {
        opacity: 0,
        y: 40,
        stagger: 0.1,
        scrollTrigger: { trigger: '.card', start: 'top 85%' },
      });
    },
  });
});
```

---

## 13. GSAP Licensing Notes

### Current Status (2025-2026)

As of April 30, 2025, **GSAP is 100% free** for all users, including commercial projects.

- Webflow acquired GSAP/GreenSock in October 2024.
- All previously paid "Club GSAP" plugins are now free: ScrollTrigger, ScrollSmoother, SplitText, MorphSVG, DrawSVG, MotionPath, Flip, Observer, and more.
- You do NOT need to be a Webflow customer to use GSAP for free.

### What You Can Do

- Use GSAP in any commercial project at no cost.
- Use ALL plugins including previously premium ones.
- Use in client work, SaaS, internal tools, etc.

### What You Cannot Do

- Implement GSAP in **tools that allow users to build visual animations without code** that competes with Webflow's visual animation building capabilities. This restriction targets competing no-code animation builders, NOT websites or apps built with GSAP.

### For Rick's Cafe

Rick's Cafe is a food blog/website, not an animation builder tool. **GSAP is fully free to use** for this project with no restrictions. No license fee, no attribution required (though giving credit is appreciated).

### Standard License

The GSAP standard license covers commercial use. Review the full terms at: https://gsap.com/community/standard-license/

---

## Quick Reference: Rick's Cafe Architecture

```
app/
  layout.tsx                  -- Wrap with <SmoothScroll> (Lenis)
  page.tsx                    -- Landing/home

components/
  providers/
    scroll-provider.tsx       -- Lenis + GSAP sync provider
  cursor/
    CustomCursor.tsx          -- GSAP quickTo cursor
    MagneticElement.tsx       -- Magnetic hover wrapper
  timeline/
    MealTimeline.tsx          -- GSAP ScrollTrigger horizontal timeline
    MealNode.tsx              -- Individual meal node (Framer Motion hover)
    TimelineProgress.tsx      -- GSAP scroll progress indicator
  sections/
    PinnedMealReveal.tsx      -- GSAP pin + scrub
    ParallaxSection.tsx       -- GSAP parallax
  ui/
    PageTransition.tsx        -- Framer Motion AnimatePresence
    Modal.tsx                 -- Framer Motion modal

lib/
  gsap-config.ts              -- Central plugin registration
```

### Installation Checklist

```bash
npm install gsap @gsap/react lenis
# Framer Motion (if not already installed)
npm install framer-motion
# or the renamed package
npm install motion
```

### Required CSS

```tsx
// In app/layout.tsx or globals.css
import 'lenis/dist/lenis.css';
```

---

## Sources

- [GSAP React Integration Guide](https://gsap.com/resources/React/)
- [GSAP ScrollTrigger Documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [@gsap/react on npm](https://www.npmjs.com/package/@gsap/react)
- [Lenis GitHub Repository](https://github.com/darkroomengineering/lenis)
- [Lenis in Next.js Guide (Bridger Tower)](https://bridger.to/lenis-nextjs)
- [Lenis + GSAP in Next.js (DevDreaming)](https://devdreaming.com/blogs/nextjs-smooth-scrolling-with-lenis-gsap)
- [GSAP ScrollTrigger Complete Guide (GSAPify)](https://gsapify.com/gsap-scrolltrigger)
- [Setting Up GSAP with Next.js: 2025 Edition](https://javascript.plainenglish.io/setting-up-gsap-with-next-js-2025-edition-bcb86e48eab6)
- [Magnetic Button Tutorial (Olivier Larose)](https://blog.olivierlarose.com/tutorials/magnetic-button)
- [Animated Cursor Tutorial (Olivier Larose)](https://blog.olivierlarose.com/tutorials/blend-mode-cursor)
- [GSAP + Framer Motion Comparison (Semaphore)](https://semaphore.io/blog/react-framer-motion-gsap)
- [GSAP vs Framer Motion (Artekia)](https://www.artekia.com/en/blog/gsap-vs-framer-motion)
- [GSAP Pricing / Free Announcement](https://gsap.com/pricing/)
- [Webflow Makes GSAP Free (Webflow Blog)](https://webflow.com/blog/gsap-becomes-free)
- [GSAP Standard License](https://gsap.com/community/standard-license/)
- [Optimizing GSAP in Next.js 15 (Thomas Augot)](https://medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15-best-practices-for-initialization-and-cleanup-2ebaba7d0232)
- [Horizontal Scroll with GSAP and Next.js (GitHub)](https://github.com/IvanSmiths/next-gsap-scroll)
- [GSAP Horizontal Scroll Effect (Webcomponents)](https://webcomponents.blog/gsap/horizontal-scroll-effect-with-react-and-gsap-scrolltrigger/)
- [Building Magnetic Cursor Effect (100 Days of Craft)](https://www.100daysofcraft.com/blog/motion-interactions/building-a-magnetic-cursor-effect)
- [Custom Cursor with GSAP and React (Medium)](https://medium.com/@amilmohd155/elevate-your-ux-build-a-smooth-custom-cursor-with-gsap-and-react-b2a1bb1c01e8)
- [Cinematic 3D Scroll Experiences with GSAP (Codrops)](https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/)
