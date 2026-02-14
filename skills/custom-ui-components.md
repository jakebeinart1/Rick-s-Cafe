# Custom UI Components -- Rick's Cafe

Bespoke, premium-feeling interactive components built from scratch. No generic UI libraries. Everything hand-crafted for the Rick's Cafe brand.

---

## Table of Contents

1. [Lightbox Gallery](#1-lightbox-gallery)
2. [Before/After Image Slider](#2-beforeafter-image-slider)
3. [Scoring System Component](#3-scoring-system-component)
4. [Masonry Photo Gallery](#4-masonry-photo-gallery)
5. [Custom Magnetic Cursor](#5-custom-magnetic-cursor)
6. [Bottom Navigation Bar](#6-bottom-navigation-bar)
7. [Accessibility Patterns](#7-accessibility-patterns)
8. [Touch and Keyboard Interaction](#8-touch-and-keyboard-interaction)
9. [Performance Optimization](#9-performance-optimization)

---

## 1. Lightbox Gallery

Full-screen photo viewer with film-strip thumbnail navigation, triggered from a masonry grid. Supports keyboard, mouse, touch/swipe, and screen readers.

### Architecture

```
components/
  lightbox/
    Lightbox.tsx           -- Full-screen overlay container
    LightboxImage.tsx      -- Main image display with loading states
    FilmStrip.tsx          -- Bottom thumbnail rail (horizontal scroll)
    LightboxControls.tsx   -- Prev/Next/Close buttons
    useLightbox.ts         -- State management hook
    useSwipeNavigation.ts  -- Touch gesture hook
```

### State Management Hook

```tsx
// useLightbox.ts
"use client";

import { useState, useCallback, useEffect } from "react";

interface UseLightboxOptions {
  images: { src: string; alt: string; width: number; height: number }[];
  onClose?: () => void;
}

export function useLightbox({ images, onClose }: UseLightboxOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const open = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = "hidden";
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = "";
    onClose?.();
  }, [onClose]);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, images.length - 1));
      setCurrentIndex(clamped);
      setIsLoading(true);
    },
    [images.length]
  );

  const next = useCallback(() => {
    goTo((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, goTo]);

  const prev = useCallback(() => {
    goTo((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, goTo]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prev();
          break;
        case "Escape":
          e.preventDefault();
          close();
          break;
        case "Home":
          e.preventDefault();
          goTo(0);
          break;
        case "End":
          e.preventDefault();
          goTo(images.length - 1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, next, prev, close, goTo, images.length]);

  return {
    isOpen,
    currentIndex,
    isLoading,
    setIsLoading,
    currentImage: images[currentIndex],
    open,
    close,
    next,
    prev,
    goTo,
    total: images.length,
  };
}
```

### Lightbox Component

```tsx
// Lightbox.tsx
"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { useSwipeNavigation } from "./useSwipeNavigation";

interface LightboxProps {
  images: { src: string; alt: string; width: number; height: number }[];
  currentIndex: number;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onGoTo: (index: number) => void;
  onLoadComplete: () => void;
}

export function Lightbox({
  images,
  currentIndex,
  isOpen,
  isLoading,
  onClose,
  onNext,
  onPrev,
  onGoTo,
  onLoadComplete,
}: LightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const filmStripRef = useRef<HTMLDivElement>(null);

  // Swipe gestures for mobile
  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: onNext,
    onSwipeRight: onPrev,
    onSwipeDown: onClose,
    threshold: 50,
  });

  // Focus trap: keep focus inside lightbox
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement;
    overlayRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, [isOpen]);

  // Auto-scroll film strip to keep active thumbnail visible
  useEffect(() => {
    if (!filmStripRef.current) return;
    const activeThumb = filmStripRef.current.children[currentIndex] as HTMLElement;
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentIndex]);

  if (!isOpen) return null;

  const current = images[currentIndex];

  return (
    <div
      ref={overlayRef}
      className="lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Image gallery, showing image ${currentIndex + 1} of ${images.length}`}
      tabIndex={-1}
      onClick={(e) => {
        // Close when clicking the backdrop (not the image or controls)
        if (e.target === overlayRef.current) onClose();
      }}
      {...swipeHandlers}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close gallery"
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          zIndex: 10,
          background: "none",
          border: "none",
          color: "white",
          fontSize: "1.5rem",
          cursor: "pointer",
          padding: "0.5rem",
          opacity: 0.7,
          transition: "opacity 200ms",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
      >
        {/* Use an SVG X icon here, or a simple character */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Image counter */}
      <div
        aria-live="polite"
        style={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
          color: "rgba(255, 255, 255, 0.6)",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.85rem",
          letterSpacing: "0.05em",
        }}
      >
        {currentIndex + 1} / {images.length}
      </div>

      {/* Navigation arrows (hidden on mobile, shown on desktop) */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="Previous image"
        className="lightbox-nav-arrow lightbox-nav-prev"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="Next image"
        className="lightbox-nav-arrow lightbox-nav-next"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Main image area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "3rem 4rem",
          position: "relative",
        }}
      >
        {isLoading && (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <div className="lightbox-spinner" />
          </div>
        )}
        <Image
          src={current.src}
          alt={current.alt}
          width={current.width}
          height={current.height}
          quality={90}
          priority
          onLoad={() => onLoadComplete()}
          style={{
            maxWidth: "100%",
            maxHeight: "calc(100vh - 160px)",
            objectFit: "contain",
            opacity: isLoading ? 0 : 1,
            transition: "opacity 300ms ease",
          }}
        />
      </div>

      {/* Film strip */}
      <div
        ref={filmStripRef}
        role="tablist"
        aria-label="Image thumbnails"
        style={{
          display: "flex",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          overflowX: "auto",
          overflowY: "hidden",
          maxWidth: "100%",
          scrollbarWidth: "none", // Firefox
          scrollBehavior: "smooth",
          // Bottom safe area for iOS
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {images.map((img, i) => (
          <button
            key={img.src}
            role="tab"
            aria-selected={i === currentIndex}
            aria-label={`View image ${i + 1}: ${img.alt}`}
            onClick={() => onGoTo(i)}
            style={{
              flexShrink: 0,
              width: "64px",
              height: "48px",
              borderRadius: "4px",
              overflow: "hidden",
              border: i === currentIndex
                ? "2px solid var(--color-gold, #d4a574)"
                : "2px solid transparent",
              opacity: i === currentIndex ? 1 : 0.5,
              transition: "all 200ms ease",
              cursor: "pointer",
              padding: 0,
              background: "none",
            }}
          >
            <Image
              src={img.src}
              alt=""
              width={64}
              height={48}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
```

### CSS for Lightbox

```css
/* lightbox.css */

/* Navigation arrows -- desktop only */
.lightbox-nav-arrow {
  display: none;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: background 200ms, transform 200ms;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.lightbox-nav-arrow:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-50%) scale(1.05);
}

.lightbox-nav-prev { left: 1rem; }
.lightbox-nav-next { right: 1rem; }

@media (min-width: 768px) {
  .lightbox-nav-arrow {
    display: flex;
  }
}

/* Hide scrollbar on film strip */
.lightbox-overlay div::-webkit-scrollbar {
  display: none;
}

/* Loading spinner */
.lightbox-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-top-color: var(--color-gold, #d4a574);
  border-radius: 50%;
  animation: lightbox-spin 800ms linear infinite;
}

@keyframes lightbox-spin {
  to { transform: rotate(360deg); }
}
```

### Swipe Navigation Hook

```tsx
// useSwipeNavigation.ts
"use client";

import { useRef, useCallback, TouchEvent } from "react";

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // minimum px to register as swipe (default 50)
  restraint?: number; // max perpendicular px (default 100)
}

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  restraint = 100,
}: SwipeOptions) {
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStart.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      const elapsed = Date.now() - touchStart.current.time;

      // Only count swipes that happen within 500ms
      if (elapsed > 500) return;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > threshold && absDy < restraint) {
        // Horizontal swipe
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
      } else if (absDy > threshold && absDx < restraint) {
        // Vertical swipe
        if (dy < 0) onSwipeUp?.();
        else onSwipeDown?.();
      }

      touchStart.current = null;
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, restraint]
  );

  return { onTouchStart, onTouchEnd };
}
```

### Usage in a Page

```tsx
// In a page or parent component
"use client";

import { useLightbox } from "@/components/lightbox/useLightbox";
import { Lightbox } from "@/components/lightbox/Lightbox";

const galleryImages = [
  { src: "/images/dish-01.jpg", alt: "Grilled octopus", width: 1200, height: 800 },
  { src: "/images/dish-02.jpg", alt: "Wagyu tartare", width: 1200, height: 900 },
  // ...
];

export default function GalleryPage() {
  const lightbox = useLightbox({ images: galleryImages });

  return (
    <>
      {/* Masonry grid triggers the lightbox */}
      <div className="masonry-grid">
        {galleryImages.map((img, i) => (
          <button key={img.src} onClick={() => lightbox.open(i)}>
            <Image src={img.src} alt={img.alt} width={400} height={300} />
          </button>
        ))}
      </div>

      <Lightbox
        images={galleryImages}
        currentIndex={lightbox.currentIndex}
        isOpen={lightbox.isOpen}
        isLoading={lightbox.isLoading}
        onClose={lightbox.close}
        onNext={lightbox.next}
        onPrev={lightbox.prev}
        onGoTo={lightbox.goTo}
        onLoadComplete={() => lightbox.setIsLoading(false)}
      />
    </>
  );
}
```

---

## 2. Before/After Image Slider

A drag-to-compare component for two images (e.g., plate full vs plate empty). Uses CSS `clip-path` for the reveal effect with unified Pointer Events for mouse+touch.

### Architecture

```
components/
  before-after/
    BeforeAfterSlider.tsx   -- Main component
    SliderHandle.tsx        -- Draggable divider line
```

### Implementation

```tsx
// BeforeAfterSlider.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  width: number;
  height: number;
  initialPosition?: number; // 0-100, default 50
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  width,
  height,
  initialPosition = 50,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
  }, []);

  // Pointer Events API unifies mouse and touch
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    },
    [isDragging, updatePosition]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard support
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2; // Shift for bigger jumps
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        setPosition((prev) => Math.max(0, prev - step));
        break;
      case "ArrowRight":
        e.preventDefault();
        setPosition((prev) => Math.min(100, prev + step));
        break;
      case "Home":
        e.preventDefault();
        setPosition(0);
        break;
      case "End":
        e.preventDefault();
        setPosition(100);
        break;
    }
  }, []);

  const aspectRatio = `${width} / ${height}`;

  return (
    <div
      ref={containerRef}
      className="before-after-container"
      style={{
        position: "relative",
        overflow: "hidden",
        aspectRatio,
        maxWidth: "100%",
        cursor: isDragging ? "grabbing" : "col-resize",
        userSelect: "none",
        touchAction: "pan-y", // Allow vertical scrolling, capture horizontal
        borderRadius: "var(--radius-lg, 12px)",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* After image (bottom layer, always fully visible) */}
      <div style={{ position: "absolute", inset: 0 }}>
        <Image
          src={afterSrc}
          alt={afterAlt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: "cover" }}
          draggable={false}
        />
        {/* Label */}
        <span
          className="before-after-label"
          style={{ position: "absolute", bottom: "1rem", right: "1rem" }}
          aria-hidden="true"
        >
          After
        </span>
      </div>

      {/* Before image (top layer, clipped by position) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `inset(0 ${100 - position}% 0 0)`,
          transition: isDragging ? "none" : "clip-path 100ms ease",
        }}
      >
        <Image
          src={beforeSrc}
          alt={beforeAlt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: "cover" }}
          draggable={false}
        />
        {/* Label */}
        <span
          className="before-after-label"
          style={{ position: "absolute", bottom: "1rem", left: "1rem" }}
          aria-hidden="true"
        >
          Before
        </span>
      </div>

      {/* Slider handle / divider line */}
      <div
        role="slider"
        aria-label="Image comparison slider"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`Showing ${Math.round(position)}% before image`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${position}%`,
          transform: "translateX(-50%)",
          width: "3px",
          backgroundColor: "white",
          boxShadow: "0 0 8px rgba(0, 0, 0, 0.3)",
          zIndex: 2,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        {/* Handle grip */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "white",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          {/* Double arrow icon */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4L3 10L7 16" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 4L17 10L13 16" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
```

### CSS for Labels

```css
/* before-after.css */
.before-after-label {
  font-family: var(--font-mono, monospace);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  pointer-events: none;
}
```

### Usage

```tsx
<BeforeAfterSlider
  beforeSrc="/images/plate-full.jpg"
  afterSrc="/images/plate-empty.jpg"
  beforeAlt="Full plate of Rick's signature pasta"
  afterAlt="Empty plate, completely devoured"
  width={1200}
  height={800}
/>
```

---

## 3. Scoring System Component

Five-axis visual breakdown: Taste, Vibe, Service, Value, and Rick Factor. Animated progress bars that trigger on scroll into view. Rick Factor gets special highlight treatment.

### Architecture

```
components/
  scoring/
    ScoreCard.tsx          -- Container for all axes
    ScoreBar.tsx           -- Single animated progress bar
    RickFactorBar.tsx      -- Special highlighted variant
    useInViewAnimation.ts  -- Intersection Observer hook
```

### Intersection Observer Hook

```tsx
// useInViewAnimation.ts
"use client";

import { useRef, useState, useEffect } from "react";

interface UseInViewOptions {
  threshold?: number;
  triggerOnce?: boolean;
  rootMargin?: string;
}

export function useInViewAnimation({
  threshold = 0.3,
  triggerOnce = true,
  rootMargin = "0px",
}: UseInViewOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, triggerOnce, rootMargin]);

  return { ref, isInView };
}
```

### Score Bar Component

```tsx
// ScoreBar.tsx
"use client";

interface ScoreBarProps {
  label: string;
  score: number; // 0-10
  isInView: boolean;
  delay?: number; // stagger delay in ms
  color?: string;
}

export function ScoreBar({
  label,
  score,
  isInView,
  delay = 0,
  color = "var(--color-gold, #d4a574)",
}: ScoreBarProps) {
  const percentage = (score / 10) * 100;

  return (
    <div
      className="score-bar"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "1rem",
      }}
    >
      {/* Label */}
      <span
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "0.8rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--color-text-secondary, #999)",
          width: "80px",
          flexShrink: 0,
          textAlign: "right",
        }}
      >
        {label}
      </span>

      {/* Track */}
      <div
        role="meter"
        aria-label={`${label} score`}
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={10}
        style={{
          flex: 1,
          height: "6px",
          backgroundColor: "var(--color-track, rgba(255,255,255,0.08))",
          borderRadius: "3px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Fill */}
        <div
          style={{
            height: "100%",
            width: isInView ? `${percentage}%` : "0%",
            backgroundColor: color,
            borderRadius: "3px",
            transition: `width 800ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
          }}
        />
      </div>

      {/* Numeric score */}
      <span
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontWeight: 600,
          fontSize: "0.9rem",
          color: "var(--color-text, #fff)",
          width: "2.5rem",
          textAlign: "right",
          opacity: isInView ? 1 : 0,
          transform: isInView ? "translateX(0)" : "translateX(-8px)",
          transition: `all 500ms ease ${delay + 400}ms`,
        }}
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
}
```

### Rick Factor Bar (Special Variant)

```tsx
// RickFactorBar.tsx
"use client";

interface RickFactorBarProps {
  score: number; // 0-10
  isInView: boolean;
  delay?: number;
}

export function RickFactorBar({ score, isInView, delay = 0 }: RickFactorBarProps) {
  const percentage = (score / 10) * 100;

  return (
    <div
      className="rick-factor-bar"
      style={{
        marginTop: "1.5rem",
        paddingTop: "1.5rem",
        borderTop: "1px solid var(--color-border, rgba(255,255,255,0.08))",
      }}
    >
      {/* Rick Factor heading */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.75rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display, serif)",
            fontSize: "1.1rem",
            fontStyle: "italic",
            color: "var(--color-gold, #d4a574)",
            letterSpacing: "0.02em",
          }}
        >
          Rick Factor
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--color-gold, #d4a574)",
            opacity: isInView ? 1 : 0,
            transform: isInView ? "scale(1)" : "scale(0.8)",
            transition: `all 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay + 600}ms`,
          }}
        >
          {score.toFixed(1)}
        </span>
      </div>

      {/* Special track with gradient and glow */}
      <div
        role="meter"
        aria-label="Rick Factor score"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={10}
        style={{
          height: "10px",
          backgroundColor: "var(--color-track, rgba(255,255,255,0.08))",
          borderRadius: "5px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: isInView ? `${percentage}%` : "0%",
            background: "linear-gradient(90deg, #d4a574, #e8c99b, #f0d5a8)",
            borderRadius: "5px",
            transition: `width 1200ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
            boxShadow: isInView
              ? "0 0 16px rgba(212, 165, 116, 0.5), 0 0 32px rgba(212, 165, 116, 0.2)"
              : "none",
          }}
        />
      </div>

      {/* Subtle tagline */}
      <p
        style={{
          fontFamily: "var(--font-body, sans-serif)",
          fontSize: "0.75rem",
          color: "var(--color-text-tertiary, #666)",
          fontStyle: "italic",
          marginTop: "0.5rem",
          opacity: isInView ? 1 : 0,
          transition: `opacity 500ms ease ${delay + 800}ms`,
        }}
      >
        {score >= 9
          ? "Legendary. Rick is already planning the return trip."
          : score >= 7
            ? "Would absolutely go back."
            : score >= 5
              ? "Worth a visit."
              : "Room for improvement."}
      </p>
    </div>
  );
}
```

### Score Card Container

```tsx
// ScoreCard.tsx
"use client";

import { ScoreBar } from "./ScoreBar";
import { RickFactorBar } from "./RickFactorBar";
import { useInViewAnimation } from "./useInViewAnimation";

interface Score {
  taste: number;
  vibe: number;
  service: number;
  value: number;
  rickFactor: number;
}

interface ScoreCardProps {
  scores: Score;
  restaurantName?: string;
}

const STAGGER_DELAY = 120; // ms between each bar

export function ScoreCard({ scores, restaurantName }: ScoreCardProps) {
  const { ref, isInView } = useInViewAnimation({ threshold: 0.3 });

  const axes = [
    { label: "Taste", score: scores.taste },
    { label: "Vibe", score: scores.vibe },
    { label: "Service", score: scores.service },
    { label: "Value", score: scores.value },
  ];

  const average =
    (scores.taste + scores.vibe + scores.service + scores.value + scores.rickFactor) / 5;

  return (
    <div
      ref={ref}
      className="score-card"
      role="region"
      aria-label={
        restaurantName
          ? `Scores for ${restaurantName}`
          : "Restaurant scores"
      }
      style={{
        padding: "2rem",
        backgroundColor: "var(--color-surface, rgba(255,255,255,0.03))",
        border: "1px solid var(--color-border, rgba(255,255,255,0.06))",
        borderRadius: "var(--radius-lg, 12px)",
        maxWidth: "480px",
      }}
    >
      {/* Overall score */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "3rem",
            fontWeight: 700,
            color: "var(--color-text, #fff)",
            lineHeight: 1,
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(12px)",
            transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {average.toFixed(1)}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary, #666)",
            marginTop: "0.5rem",
          }}
        >
          Overall
        </div>
      </div>

      {/* Individual score bars with stagger */}
      {axes.map((axis, i) => (
        <ScoreBar
          key={axis.label}
          label={axis.label}
          score={axis.score}
          isInView={isInView}
          delay={i * STAGGER_DELAY}
        />
      ))}

      {/* Rick Factor -- the special one */}
      <RickFactorBar
        score={scores.rickFactor}
        isInView={isInView}
        delay={axes.length * STAGGER_DELAY}
      />
    </div>
  );
}
```

### Usage

```tsx
<ScoreCard
  restaurantName="Osteria Francescana"
  scores={{
    taste: 9.5,
    vibe: 8.8,
    service: 9.2,
    value: 7.5,
    rickFactor: 9.8,
  }}
/>
```

---

## 4. Masonry Photo Gallery

A responsive, lazy-loaded masonry grid that works with `next/image`. Pure CSS columns approach with JS measurement fallback for precision.

### Approach: CSS Columns

CSS `column-count` / `column-width` is the most reliable cross-browser masonry technique today. Native CSS Grid masonry (`grid-template-rows: masonry`) is only available behind flags in Firefox and is not production-ready.

The CSS columns approach reads top-to-bottom then left-to-right, which is acceptable for photo galleries. For a strict left-to-right reading order, use the JS measurement approach below.

### CSS Columns Implementation

```tsx
// MasonryGallery.tsx
"use client";

import { useCallback, useState } from "react";
import Image from "next/image";

interface GalleryImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
}

interface MasonryGalleryProps {
  images: GalleryImage[];
  onImageClick?: (index: number) => void;
  columns?: { sm: number; md: number; lg: number; xl: number };
  gap?: string;
}

export function MasonryGallery({
  images,
  onImageClick,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = "1rem",
}: MasonryGalleryProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const handleLoad = useCallback((index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  }, []);

  return (
    <div
      className="masonry-gallery"
      role="list"
      aria-label="Photo gallery"
      style={{
        columnCount: columns.sm,
        columnGap: gap,
        // Responsive column counts set via CSS variables or media queries
      }}
    >
      {images.map((img, i) => (
        <div
          key={img.src}
          role="listitem"
          className="masonry-item"
          style={{
            breakInside: "avoid",
            marginBottom: gap,
            borderRadius: "var(--radius-md, 8px)",
            overflow: "hidden",
            cursor: onImageClick ? "pointer" : "default",
            opacity: loadedImages.has(i) ? 1 : 0,
            transform: loadedImages.has(i) ? "scale(1)" : "scale(0.98)",
            transition: "opacity 400ms ease, transform 400ms ease",
          }}
          onClick={() => onImageClick?.(i)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onImageClick?.(i);
            }
          }}
          tabIndex={onImageClick ? 0 : undefined}
          role={onImageClick ? "button" : "listitem"}
          aria-label={onImageClick ? `View ${img.alt}` : undefined}
        >
          <Image
            src={img.src}
            alt={img.alt}
            width={img.width}
            height={img.height}
            placeholder={img.blurDataURL ? "blur" : "empty"}
            blurDataURL={img.blurDataURL}
            loading="lazy"
            sizes={`(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw`}
            onLoad={() => handleLoad(i)}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
          />
        </div>
      ))}
    </div>
  );
}
```

### Responsive CSS

```css
/* masonry-gallery.css */
.masonry-gallery {
  column-count: 1; /* mobile */
  column-gap: 1rem;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .masonry-gallery {
    column-count: 2;
  }
}

@media (min-width: 1024px) {
  .masonry-gallery {
    column-count: 3;
  }
}

@media (min-width: 1280px) {
  .masonry-gallery {
    column-count: 4;
  }
}

/* Hover effect for gallery items */
.masonry-item {
  position: relative;
}

.masonry-item::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.3) 0%,
    transparent 40%
  );
  opacity: 0;
  transition: opacity 300ms ease;
  pointer-events: none;
  border-radius: inherit;
}

.masonry-item:hover::after {
  opacity: 1;
}

/* Focus visible ring */
.masonry-item:focus-visible {
  outline: 2px solid var(--color-gold, #d4a574);
  outline-offset: 2px;
}
```

### Alternative: JS-Measured Masonry (Left-to-Right Order)

For strict left-to-right reading order (important for chronological feeds), measure items and distribute across columns by shortest column height:

```tsx
// useJsMasonry.ts
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface MasonryItem {
  index: number;
  height: number;
}

export function useJsMasonry<T>(items: T[], columnCount: number) {
  const [columns, setColumns] = useState<T[][]>([]);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  const measureAndLayout = useCallback(() => {
    const columnHeights = new Array(columnCount).fill(0);
    const newColumns: T[][] = Array.from({ length: columnCount }, () => []);

    items.forEach((item, i) => {
      // Find the shortest column
      const shortestCol = columnHeights.indexOf(Math.min(...columnHeights));
      newColumns[shortestCol].push(item);

      // Estimate or measure height
      const el = itemRefs.current.get(i);
      const height = el?.getBoundingClientRect().height ?? 300; // fallback estimate
      columnHeights[shortestCol] += height;
    });

    setColumns(newColumns);
  }, [items, columnCount]);

  useEffect(() => {
    measureAndLayout();

    const observer = new ResizeObserver(() => measureAndLayout());
    itemRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [measureAndLayout]);

  const setItemRef = useCallback((index: number, el: HTMLElement | null) => {
    if (el) itemRefs.current.set(index, el);
    else itemRefs.current.delete(index);
  }, []);

  return { columns, setItemRef };
}
```

### Integration with Lightbox

The masonry gallery naturally feeds into the lightbox. When a user clicks any image in the grid, pass the flat `images` array and the clicked `index` to `lightbox.open(index)`. The film strip in the lightbox corresponds 1:1 with the gallery order.

---

## 5. Custom Magnetic Cursor

Desktop-only custom cursor that follows the mouse with spring physics and "magnetizes" toward interactive elements on hover. Shape-morphs between states (default dot, expanded ring on hover, play button on video elements).

### Architecture

```
components/
  cursor/
    MagneticCursor.tsx      -- Main cursor element (renders a portal)
    MagneticTarget.tsx      -- Wrapper that registers magnetic targets
    CursorContext.tsx        -- Shared state for cursor shape/variant
    useCursorPhysics.ts     -- Animation loop with lerp
```

### Cursor Context

```tsx
// CursorContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type CursorVariant = "default" | "hover" | "text" | "play" | "drag" | "hidden";

interface CursorContextType {
  variant: CursorVariant;
  setVariant: (v: CursorVariant) => void;
  magnetTarget: { x: number; y: number } | null;
  setMagnetTarget: (target: { x: number; y: number } | null) => void;
}

const CursorContext = createContext<CursorContextType | null>(null);

export function CursorProvider({ children }: { children: ReactNode }) {
  const [variant, setVariant] = useState<CursorVariant>("default");
  const [magnetTarget, setMagnetTarget] = useState<{
    x: number;
    y: number;
  } | null>(null);

  return (
    <CursorContext.Provider value={{ variant, setVariant, magnetTarget, setMagnetTarget }}>
      {children}
    </CursorContext.Provider>
  );
}

export function useCursor() {
  const ctx = useContext(CursorContext);
  if (!ctx) throw new Error("useCursor must be used within CursorProvider");
  return ctx;
}
```

### Physics-Based Cursor Hook

```tsx
// useCursorPhysics.ts
"use client";

import { useRef, useEffect } from "react";

interface CursorPhysicsOptions {
  smoothing?: number; // lerp factor, 0-1 (lower = smoother, default 0.15)
  magnetStrength?: number; // 0-1, how strongly cursor pulls toward targets (default 0.3)
}

export function useCursorPhysics(
  magnetTarget: { x: number; y: number } | null,
  { smoothing = 0.15, magnetStrength = 0.3 }: CursorPhysicsOptions = {}
) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const position = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    // Skip on touch devices
    if (typeof window !== "undefined" && "ontouchstart" in window) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      // Target is either the mouse position or a magnetic target (blended)
      let targetX = mouse.current.x;
      let targetY = mouse.current.y;

      if (magnetTarget) {
        // Blend between mouse and magnet target
        targetX = targetX + (magnetTarget.x - targetX) * magnetStrength;
        targetY = targetY + (magnetTarget.y - targetY) * magnetStrength;
      }

      // Lerp toward target
      position.current.x += (targetX - position.current.x) * smoothing;
      position.current.y += (targetY - position.current.y) * smoothing;

      if (cursorRef.current) {
        cursorRef.current.style.transform =
          `translate3d(${position.current.x}px, ${position.current.y}px, 0)`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId.current);
    };
  }, [magnetTarget, smoothing, magnetStrength]);

  return cursorRef;
}
```

### Main Cursor Component

```tsx
// MagneticCursor.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCursor } from "./CursorContext";
import { useCursorPhysics } from "./useCursorPhysics";

const CURSOR_SIZES: Record<string, { width: number; height: number }> = {
  default: { width: 12, height: 12 },
  hover: { width: 48, height: 48 },
  text: { width: 2, height: 24 },
  play: { width: 56, height: 56 },
  drag: { width: 56, height: 56 },
  hidden: { width: 0, height: 0 },
};

export function MagneticCursor() {
  const { variant, magnetTarget } = useCursor();
  const cursorRef = useCursorPhysics(magnetTarget);
  const [isMounted, setIsMounted] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Do not render on touch devices or during SSR
  if (!isMounted || isTouch) return null;

  const size = CURSOR_SIZES[variant] ?? CURSOR_SIZES.default;

  const cursorElement = (
    <div
      ref={cursorRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: `${size.width}px`,
        height: `${size.height}px`,
        marginLeft: `${-size.width / 2}px`,
        marginTop: `${-size.height / 2}px`,
        borderRadius: variant === "text" ? "1px" : "50%",
        pointerEvents: "none",
        zIndex: 99999,
        mixBlendMode: "difference",
        transition: "width 300ms cubic-bezier(0.16, 1, 0.3, 1), height 300ms cubic-bezier(0.16, 1, 0.3, 1), margin 300ms cubic-bezier(0.16, 1, 0.3, 1), border-radius 300ms ease, opacity 200ms ease",
        willChange: "transform",

        // Variant styles
        ...(variant === "default" && {
          backgroundColor: "white",
        }),
        ...(variant === "hover" && {
          backgroundColor: "transparent",
          border: "1.5px solid white",
        }),
        ...(variant === "text" && {
          backgroundColor: "white",
        }),
        ...(variant === "play" && {
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "1.5px solid rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }),
        ...(variant === "hidden" && {
          opacity: 0,
        }),
      }}
    >
      {variant === "play" && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
          <polygon points="4,2 14,8 4,14" />
        </svg>
      )}
      {variant === "drag" && (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.5">
          <path d="M7 4L3 10L7 16M13 4L17 10L13 16" />
        </svg>
      )}
    </div>
  );

  return createPortal(cursorElement, document.body);
}
```

### Magnetic Target Wrapper

```tsx
// MagneticTarget.tsx
"use client";

import { useRef, useCallback, ReactNode } from "react";
import { useCursor, CursorVariant } from "./CursorContext";

interface MagneticTargetProps {
  children: ReactNode;
  variant?: CursorVariant;
  strength?: number; // 0-1, magnetic pull strength
  className?: string;
}

export function MagneticTarget({
  children,
  variant = "hover",
  strength = 0.3,
  className,
}: MagneticTargetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { setVariant, setMagnetTarget } = useCursor();

  const handleMouseEnter = useCallback(() => {
    setVariant(variant);
  }, [variant, setVariant]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Set the magnetic target to element center
      setMagnetTarget({ x: centerX, y: centerY });

      // Also shift the element itself toward the cursor (subtle magnetic pull)
      const offsetX = (e.clientX - centerX) * strength;
      const offsetY = (e.clientY - centerY) * strength;
      ref.current.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    },
    [strength, setMagnetTarget]
  );

  const handleMouseLeave = useCallback(() => {
    setVariant("default");
    setMagnetTarget(null);
    if (ref.current) {
      ref.current.style.transform = "translate(0, 0)";
      ref.current.style.transition = "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)";
      // Remove the transition after it completes to avoid interfering with future moves
      setTimeout(() => {
        if (ref.current) ref.current.style.transition = "";
      }, 400);
    }
  }, [setVariant, setMagnetTarget]);

  return (
    <div
      ref={ref}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ willChange: "transform" }}
    >
      {children}
    </div>
  );
}
```

### Global CSS for Hiding Default Cursor

```css
/* cursor.css -- only on desktop */
@media (hover: hover) and (pointer: fine) {
  /* Hide default cursor globally when custom cursor is active */
  * {
    cursor: none !important;
  }
}
```

### Layout Integration

```tsx
// app/layout.tsx
import { CursorProvider } from "@/components/cursor/CursorContext";
import { MagneticCursor } from "@/components/cursor/MagneticCursor";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CursorProvider>
          <MagneticCursor />
          {children}
        </CursorProvider>
      </body>
    </html>
  );
}
```

### Usage on Interactive Elements

```tsx
import { MagneticTarget } from "@/components/cursor/MagneticTarget";

// Button with magnetic hover
<MagneticTarget variant="hover" strength={0.2}>
  <button className="btn-primary">Read Review</button>
</MagneticTarget>

// Text area
<MagneticTarget variant="text">
  <p>Hover over this text for the I-beam cursor</p>
</MagneticTarget>

// Video with play cursor
<MagneticTarget variant="play" strength={0.15}>
  <video src="/video/kitchen.mp4" />
</MagneticTarget>
```

---

## 6. Bottom Navigation Bar

Mobile-only dock-style navigation with four items: Home, Timeline, Search, About. Uses safe area insets for iOS compatibility, highlights the active route, and hides on scroll-down / shows on scroll-up.

### Architecture

```
components/
  navigation/
    BottomNav.tsx          -- Main component
    BottomNavItem.tsx      -- Individual nav item
    useScrollDirection.ts  -- Show/hide on scroll
```

### Scroll Direction Hook

```tsx
// useScrollDirection.ts
"use client";

import { useState, useEffect, useRef } from "react";

export function useScrollDirection(threshold: number = 10) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const diff = scrollY - lastScrollY.current;

      // Only update after crossing threshold to prevent jitter
      if (Math.abs(diff) < threshold) {
        ticking.current = false;
        return;
      }

      setIsVisible(diff < 0 || scrollY < 50); // Show when scrolling up or near top
      lastScrollY.current = scrollY;
      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return isVisible;
}
```

### Bottom Navigation Component

```tsx
// BottomNav.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useScrollDirection } from "./useScrollDirection";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Match pattern: "exact" for Home ("/"), "startsWith" for sections */
  matchMode?: "exact" | "startsWith";
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Home",
    matchMode: "exact",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/timeline",
    label: "Timeline",
    matchMode: "startsWith",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: "/search",
    label: "Search",
    matchMode: "startsWith",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    href: "/about",
    label: "About",
    matchMode: "exact",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const isVisible = useScrollDirection();

  const isActive = (item: NavItem) => {
    if (item.matchMode === "exact") return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <nav
      className="bottom-nav"
      role="navigation"
      aria-label="Main navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transform: isVisible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        // Safe area inset for iOS
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        backgroundColor: "rgba(10, 10, 10, 0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          height: "56px",
          maxWidth: "480px",
          margin: "0 auto",
          padding: "0 0.5rem",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                padding: "0.5rem 0.75rem",
                borderRadius: "12px",
                textDecoration: "none",
                color: active
                  ? "var(--color-gold, #d4a574)"
                  : "rgba(255, 255, 255, 0.4)",
                transition: "color 200ms ease",
                WebkitTapHighlightColor: "transparent",
                position: "relative",
              }}
            >
              {/* Active indicator dot */}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    top: "2px",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-gold, #d4a574)",
                  }}
                />
              )}
              {item.icon}
              <span
                style={{
                  fontSize: "0.6rem",
                  fontFamily: "var(--font-mono, monospace)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### CSS

```css
/* bottom-nav.css */

/* Only show on mobile (below 768px) */
.bottom-nav {
  display: flex;
}

@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }
}

/* Add bottom padding to body so content is not hidden behind nav */
@media (max-width: 767px) {
  body {
    padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px));
  }
}
```

### Required Viewport Meta

The `viewport-fit=cover` attribute is required for `env(safe-area-inset-bottom)` to work on iOS:

```tsx
// app/layout.tsx
export const metadata = {
  // ...
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
};
```

In Next.js 14+, use the `viewport` export from the layout:

```tsx
// app/layout.tsx
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
```

---

## 7. Accessibility Patterns

Every custom component must be usable with keyboard, screen readers, and alternative input devices.

### General Principles

1. **Semantic HTML first.** Use `<button>`, `<a>`, `<nav>`, `<dialog>` before reaching for `<div>` with roles.
2. **ARIA only when native semantics fall short.** `role="slider"`, `role="meter"`, `role="dialog"`, `role="tablist"` supplement where HTML has no equivalent.
3. **Focus management.** Modals (lightbox) must trap focus. On open, focus moves in. On close, focus returns to the trigger element.
4. **Visible focus rings.** Use `:focus-visible` to show outlines for keyboard users without affecting mouse users.
5. **`aria-live` regions.** Dynamic content changes (image counter in lightbox, score values) should announce to screen readers.
6. **Reduced motion.** Respect `prefers-reduced-motion: reduce` for all animations.

### Component-Specific Accessibility

| Component | Role / Semantics | Keyboard | Screen Reader |
|---|---|---|---|
| Lightbox | `role="dialog"` `aria-modal="true"` | Arrow keys navigate, Escape closes, Home/End jump | `aria-live="polite"` for image counter |
| Before/After Slider | `role="slider"` with `aria-valuenow` | Arrow keys adjust position, Shift+Arrow for big jumps, Home/End | `aria-valuetext` describes current state |
| Score Bars | `role="meter"` with `aria-valuenow/min/max` | N/A (read-only) | Score values read out by label |
| Masonry Gallery | `role="list"` + `role="listitem"` | Tab between items, Enter/Space to open lightbox | `alt` text on every image |
| Custom Cursor | `aria-hidden="true"` | N/A (decorative only) | Completely hidden from AT |
| Bottom Nav | `<nav>` + `aria-label` | Tab navigation, standard link behavior | `aria-current="page"` on active item |

### Reduced Motion

```css
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

### Focus Visible Utility

```css
/* Global focus-visible style */
:focus-visible {
  outline: 2px solid var(--color-gold, #d4a574);
  outline-offset: 2px;
}

/* Remove default focus ring for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Focus Trap for Modals

```tsx
// useFocusTrap.ts
"use client";

import { useEffect, useRef } from "react";

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = container.querySelectorAll(focusableSelector);
      const firstEl = focusableElements[0] as HTMLElement;
      const lastEl = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [isActive]);

  return containerRef;
}
```

---

## 8. Touch and Keyboard Interaction

### Touch Patterns

| Gesture | Component | Action |
|---|---|---|
| Swipe left | Lightbox | Next image |
| Swipe right | Lightbox | Previous image |
| Swipe down | Lightbox | Close lightbox |
| Horizontal drag | Before/After Slider | Adjust comparison position |
| Tap | Masonry Gallery | Open lightbox at that image |
| Tap | Bottom Nav | Navigate to route |

### Pointer Events API

Use the Pointer Events API (`onPointerDown`, `onPointerMove`, `onPointerUp`) instead of separate mouse and touch event handlers. Pointer Events unify mouse, touch, and pen input.

```tsx
// Key pattern: setPointerCapture for reliable drag tracking
const handlePointerDown = (e: React.PointerEvent) => {
  e.preventDefault();
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
  setIsDragging(true);
};
```

`setPointerCapture` ensures that `pointermove` events continue to fire on the element even if the pointer leaves its bounds -- essential for reliable slider dragging.

### Touch Action CSS

Control which gestures the browser handles vs. your component:

```css
/* Allow vertical scroll, disable horizontal (for sliders) */
.before-after-container {
  touch-action: pan-y;
}

/* Disable all default gestures (for lightbox swipe area) */
.lightbox-image-area {
  touch-action: none;
}

/* Allow all default gestures (for masonry scroll) */
.masonry-gallery {
  touch-action: auto;
}
```

### Keyboard Patterns

| Key | Component | Action |
|---|---|---|
| ArrowLeft/Right | Lightbox | Navigate images |
| Escape | Lightbox | Close |
| Home / End | Lightbox | First / last image |
| ArrowLeft/Right | Before/After Slider | Adjust position (2% per press) |
| Shift + Arrow | Before/After Slider | Adjust position (10% per press) |
| Home / End | Before/After Slider | 0% / 100% |
| Tab | All | Move between focusable elements |
| Enter / Space | Masonry items | Open lightbox |

---

## 9. Performance Optimization

### Image Lazy Loading with next/image

```tsx
<Image
  src={src}
  alt={alt}
  width={width}
  height={height}
  loading="lazy"                         // Native lazy loading
  placeholder="blur"                     // Show blur while loading
  blurDataURL={blurDataURL}              // Base64 tiny image
  sizes="(max-width: 640px) 100vw, 33vw" // Responsive sizing hints
  quality={75}                           // Compression quality
/>
```

**Generating blurDataURL at build time:**

```tsx
// lib/images.ts
import { getPlanarYCbCrData } from "sharp";

export async function getBlurDataURL(imagePath: string): Promise<string> {
  const sharp = (await import("sharp")).default;
  const buffer = await sharp(imagePath)
    .resize(10, 10, { fit: "inside" })
    .toBuffer();
  return `data:image/png;base64,${buffer.toString("base64")}`;
}
```

### Animation Performance Checklist

1. **GPU-accelerated properties only.** Animate `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`, `margin`, or `padding`.
2. **`will-change: transform`** on elements that animate frequently (cursor, lightbox transitions).
3. **`requestAnimationFrame`** for physics loops (cursor). Never run physics on `mousemove` directly.
4. **`contain: layout paint`** on masonry items to limit reflow scope.
5. **`content-visibility: auto`** on off-screen masonry items for rendering optimization.

```css
/* Masonry performance hints */
.masonry-item {
  contain: layout paint;
  content-visibility: auto;
  contain-intrinsic-size: 300px 200px; /* estimated size for off-screen items */
}
```

### Virtualization for Large Galleries

For galleries with 50+ images, virtualize off-screen items to reduce DOM nodes. Use IntersectionObserver to mount/unmount items:

```tsx
// useVirtualizedMasonry.ts
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useVirtualItem(rootMargin: string = "200px") {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, isVisible };
}

// Usage in masonry item
function MasonryItem({ image, index, onImageClick }) {
  const { ref, isVisible } = useVirtualItem("300px");

  return (
    <div
      ref={ref}
      style={{
        breakInside: "avoid",
        aspectRatio: `${image.width} / ${image.height}`,
      }}
    >
      {isVisible ? (
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading="lazy"
          onClick={() => onImageClick(index)}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", backgroundColor: "var(--color-surface)" }} />
      )}
    </div>
  );
}
```

### Code Splitting

Load heavy components only when needed:

```tsx
// Lightbox loaded on demand (not in initial bundle)
import dynamic from "next/dynamic";

const Lightbox = dynamic(() => import("@/components/lightbox/Lightbox").then(mod => ({ default: mod.Lightbox })), {
  ssr: false,
  loading: () => null,
});
```

### Bundle Size Targets

Keep custom components lightweight. No external animation libraries needed for this project -- all animations use CSS transitions, CSS keyframes, and `requestAnimationFrame`. This keeps the JS bundle minimal.

| Component | Target JS Size | Notes |
|---|---|---|
| Lightbox | < 3 KB gzipped | Hook + component |
| Before/After Slider | < 1.5 KB gzipped | Single component |
| Score Card | < 2 KB gzipped | Hook + 3 components |
| Masonry Gallery | < 1.5 KB gzipped | CSS does the heavy lifting |
| Magnetic Cursor | < 2 KB gzipped | Context + physics loop |
| Bottom Nav | < 1 KB gzipped | Mostly markup |

### Reducing Layout Shifts

1. Always provide `width` and `height` (or `aspectRatio`) on images so the browser reserves space before load.
2. Use `blurDataURL` placeholder for visible images to fill the space during load.
3. For masonry, set `contain-intrinsic-size` on items with `content-visibility: auto`.
4. Bottom nav: add `padding-bottom` to body in CSS (not JS) so content does not shift when nav mounts.

---

## Quick Reference: File Structure

```
src/
  components/
    lightbox/
      Lightbox.tsx
      LightboxImage.tsx
      FilmStrip.tsx
      LightboxControls.tsx
      useLightbox.ts
      useSwipeNavigation.ts
      lightbox.css
    before-after/
      BeforeAfterSlider.tsx
      before-after.css
    scoring/
      ScoreCard.tsx
      ScoreBar.tsx
      RickFactorBar.tsx
      useInViewAnimation.ts
    gallery/
      MasonryGallery.tsx
      masonry-gallery.css
    cursor/
      MagneticCursor.tsx
      MagneticTarget.tsx
      CursorContext.tsx
      useCursorPhysics.ts
      cursor.css
    navigation/
      BottomNav.tsx
      useScrollDirection.ts
      bottom-nav.css
    shared/
      useFocusTrap.ts
```
