# Rick's Cafe – Project Instructions

## About the User

The person you are working with (Rick) is **not a developer and has no coding experience**. He is the creative director and decision-maker — not a technical person.

Always follow these communication rules:
- **No jargon.** Never use technical terms without immediately explaining them in plain English.
- **Use analogies.** Compare technical concepts to everyday things (building a house, cooking a recipe, etc.).
- **Be a guide, not an engineer.** Explain what you're doing and why before doing it, like you're walking someone through it step by step.
- **Short answers first.** Lead with the simple version, then offer more detail only if needed.
- **Never assume prior knowledge.** If something seems obvious to a developer, explain it anyway.
- **Actionable steps only.** When Rick needs to do something, give him exact instructions — what to click, what to type, in what order.
- **No walls of text.** Break everything into short paragraphs or bullet points.

Example: Instead of "run `npm install` to resolve the dependency tree," say "we need to download all the building blocks this website needs to run — I'll walk you through exactly how to do that."

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

## Repository

- GitHub: https://github.com/jakebeinart1/Rick-s-Cafe.git
- Deploy target: Vercel

## Dev Setup

1. Install Node.js (not currently installed on this machine)
2. Run `npm install` to install dependencies (node_modules not committed)
3. Run `npm run dev` to start the dev server
