# Rick's Cafe – Project Instructions

## Project Overview

Rick's Cafe is an immersive food blog built as a digital "world" — not a standard blog layout.
The full project manual lives in `context/PROJECT_MANUAL.md`. Read it before starting any work.

## Tech Stack

- **Next.js 14+** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **Framer Motion** for page transitions and micro-interactions
- **GSAP** for timeline animations
- **Lenis** for smooth scrolling
- **Sanity.io** as the headless CMS (GROQ for queries)
- **Vercel** for deployment

## Design Philosophy

- Reference UI: Graffico.it — heavy whitespace, momentum scrolling, immersive transitions
- **No generic UI component libraries.** Everything must feel bespoke and handcrafted.
- Mobile-first. Performance is non-negotiable — use `next/image` for all photos.
- Page transitions via Framer Motion `AnimatePresence` — no hard page refreshes.
- Typography: Bold serif for headings, clean sans-serif for body text.

## Architecture Rules

- Use the App Router (`/app` directory). No Pages Router.
- Folder structure: `/components`, `/lib`, `/hooks`, `/styles`, `/context`.
- Data fetching: GROQ queries via Sanity client. Fetch only what's needed per view.
- Images are served through Sanity's CDN with Next/Image optimization.

## Key Features (Must Understand)

1. **Scoring System**: 5-axis breakdown (Taste, Vibe, Service, Value, Rick Factor) — not just a single number.
2. **Timeline Navigation**: Scroll-driven immersive timeline, not a paginated list.
3. **Lightbox Gallery**: Full-screen photo viewer with film-strip nav on restaurant detail pages.
4. **Custom Cursor**: Desktop-only magnetic cursor that reacts to interactive elements.

## Build Order

1. Sanity schemas + frontend connection
2. Restaurant detail page (`/restaurant/[slug]`)
3. Timeline/World homepage
4. About story page

## Code Standards

- TypeScript strict mode.
- Components should be small, composable, and well-named.
- Animations should respect `prefers-reduced-motion`.
- All interactive elements need keyboard and touch accessibility.
