# Houston After Dark — Homepage Redesign

## Overview

Replace the vertical timeline homepage with a cinematic horizontal-scrolling gallery. Warm, saturated color palette. Layered visual effects (parallax, film grain, particles, clip-path reveals, text scramble). Houston food scene photography.

## Art Direction

Mood: Dimly-lit Houston restaurant at golden hour. Serious about food, magnetic and alive.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| primary-bg | #1a1410 | Deep warm black (dark wood) |
| secondary-bg | #2a1f18 | Dark espresso |
| accent-1 | #e07a3a | Burnt amber (CTAs, highlights) |
| accent-2 | #c44536 | Smoky red (scores, emphasis) |
| accent-3 | #2a9d8f | Teal (contrast pops, hover) |
| warm-gold | #d4a853 | Metallic accents, borders |
| text | #f0e6d3 | Warm cream |
| muted | #8a7e72 | Warm gray |

### Typography

- Playfair Display (serif) — headings, 8-12vw hero scale
- Inter (sans) — body text, standard sizes

### Texture Layers

- Film grain: CSS noise filter, 3-5% opacity
- Floating particles: Canvas, ~30 warm-toned circles
- Vignette: Radial gradient at viewport edges

## Page Structure

### Section A — Hero Landing

- Full viewport, dark background
- "RICK'S CAFE" at 12vw+ serif, stacked
- Subtitle: "A Houston Food Journey"
- Right-pointing scroll arrow
- Background food photo at 15% opacity with warm tint

### Section B — Horizontal Timeline

- Vertical scroll → horizontal via GSAP ScrollTrigger pin
- Each panel ~80vw wide
- 3 depth layers per panel:
  - Back: Color gradient blob
  - Mid: Hero photo with parallax
  - Front: Text content
- Entry animations: clip-path reveal, text scramble, score counter
- Horizontal timeline line with date markers
- Progress bar at bottom

### Section C — Footer

- Unpins from horizontal scroll
- "Explore the Full Journey" CTA
- Links to About page

## Visual Effects

| Effect | Tech | Location |
|--------|------|----------|
| V→H scroll | GSAP ScrollTrigger | Timeline |
| 3-layer parallax | GSAP x offsets | Panels |
| Clip-path reveals | CSS clip-path + GSAP | Images |
| Text scramble | Custom JS | Names |
| Film grain | CSS SVG filter | Viewport |
| Particles | Canvas 2D | Viewport |
| Score counter | Number animation | Scores |
| Vignette | Radial gradient | Viewport |
| Progress bar | scaleX + scroll | Bottom |

## Mock Data

Unsplash photos of Houston cuisine: BBQ, Tex-Mex, Vietnamese, Gulf seafood, kolaches, upscale plated dishes.

## Responsive

- Desktop: Full horizontal scroll + all effects
- Mobile: Vertical fallback, horizontal card swipe, reduced particles, simplified reveals

## Files

### New

- `src/components/timeline/HorizontalTimeline.tsx`
- `src/components/timeline/TimelinePanel.tsx`
- `src/components/effects/FilmGrain.tsx`
- `src/components/effects/ParticleField.tsx`
- `src/components/effects/TextScramble.tsx`
- `src/components/effects/ProgressBar.tsx`

### Modified

- `src/app/HomeClient.tsx`
- `src/app/globals.css`
- `src/components/timeline/TimelineHero.tsx`
- `src/app/layout.tsx`
