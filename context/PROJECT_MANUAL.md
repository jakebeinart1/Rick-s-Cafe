# PROJECT_MANUAL: Rick's Cafe – Immersive Food Blog

## 1. Vision & Brand Identity

**Concept:** Rick's Cafe is not just a blog; it's a digital "world" documenting a culinary journey.
**Origin Story:** Based on a high school fundraiser involving tiki torches and a Hawaiian theme. This "vibe" (warmth, community, DIY but elevated) should permeate the UI.
**Reference UI:** [Graffico.it](https://graffico.it/)

- **Key UX Pillars:** Heavy use of whitespace, smooth momentum scrolling, micro-interactions, immersive transitions, and a "timeline" that feels like navigating a map or a story rather than a list.

## 2. Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Deployment:** Vercel
- **Styling:** Tailwind CSS + Framer Motion (for the "Graffico" motion feel)
- **CMS:** Sanity.io (Crucial for "granular" reviews and multi-image handling)
- **Database/Auth:** Supabase (if we add user comments/bookmarks later)
- **Animations:** GSAP for the timeline and Lenis for smooth scrolling.

## 3. System Architecture & Task Breakdown

*Note: These tasks are designed to be run in parallel across multiple terminals/agents.*

### Terminal A: Core Infrastructure & CMS (The "Brain")

**Task A1: Repository Scaffolding**

- Initialize Next.js with TypeScript, Tailwind, and ESLint.
- Setup Folder Structure: `/components`, `/lib`, `/hooks`, `/styles`, `/context`.
- Install dependencies: `framer-motion`, `gsap`, `lucide-react`, `clsx`, `tailwind-merge`.

**Task A2: Sanity CMS Schema Design**

- Create a `restaurant` schema:
  - Name, Location, Cuisine, Price Range ($-$$$$).
  - Rick's Score (1-10).
  - Summary Text + Full Markdown Review.
  - Image Gallery (Array of images with captions).
  - Date Visited (for the timeline).
- Create a `siteSettings` schema for the "About/History" content.

### Terminal B: The "Immersive World" Timeline (The "Heart")

**Task B1: Horizontal/Vertical Immersive Timeline**

- Build a custom "World Navigation" component inspired by Graffico.
- Implement a scroll-driven timeline where meals appear as "nodes" in space.
- Use Framer Motion `useScroll` and `useTransform` to create parallax effects for meal photos as the user scrolls.

**Task B2: Mobile-First UX (Web App Feel)**

- Implement "Snap-to-section" logic for mobile users.
- Design a bottom-docked navigation bar (Home, Timeline, Search, About).
- Ensure all hover interactions have touch-start equivalents.

### Terminal C: UI/UX & Detail Pages (The "Skin")

**Task C1: The Granular Review Template**

- Build the `/restaurant/[slug]` dynamic route.
- Layout requirements:
  - Hero: Full-screen high-res image of the "star dish."
  - The "Stats Bar": Sticky sidebar or header showing the Score, Price, and Location.
  - Masonry Gallery: A sophisticated grid for the "multiple pictures per restaurant."
  - Typography: Use a mix of a bold Serif (for headings) and a clean Sans-serif (for body).

**Task C2: The "Rick's Cafe" About Page**

- Implement the "Tiki Torch" story using an immersive scroll-telling format.
- Use "Reveal on scroll" animations for the text.
- Add a "Timeline of the Name" section showing the transition from the school fundraiser to the modern blog.

## 4. Specific Feature Requirements

### The Scoring System (Granular)

The score should not just be a number. Create a visual component that breaks down:

- **Taste:** (Progress bar)
- **Vibe:** (Progress bar)
- **Service:** (Progress bar)
- **Value:** (Progress bar)
- **The "Rick Factor":** (Special highlight for unique elements)

### The Gallery Experience

- Implement a "Lightbox" feature. When a user clicks a photo in a review, it should expand to full screen with a "film-strip" navigation at the bottom.
- Support for "Before/After" sliders (e.g., the plate full vs. the plate empty).

### Navigation & Transition

- **Page Transitions:** Use Framer Motion `AnimatePresence`. No hard refreshes. Every page should "slide" or "fade" in like a high-end mobile app.
- **Cursor:** (Desktop only) A custom magnetic cursor that changes shape when hovering over meal nodes.

## 5. Instructions for Coding Agent

1. **Strict UI Fidelity:** Do not use standard Shadcn/UI buttons unless heavily customized. Everything must feel bespoke. Refer to the spacing and "floaty" feel of Graffico.it.
2. **Performance First:** Use Next/Image for all photos. Richard wants "multiple photos per restaurant," so optimization is non-negotiable to prevent lag on mobile.
3. **Data Fetching:** Use GROQ (Sanity's query language) to fetch only the data needed for the timeline view to keep it snappy.
4. **Build Order:**
   - Step 1: Build the Sanity schemas and connect the frontend.
   - Step 2: Build the "Review Detail" page (the most data-heavy part).
   - Step 3: Build the "Timeline/World" homepage (the most animation-heavy part).
   - Step 4: Build the "About" story page.

## 6. The "Story" Content (For About Page)

*Context for the AI:*
"Rick's Cafe started as a Hawaiian-themed fundraiser. Tiki torches, school community, and a vibe of bringing people together over food. This blog is the digital evolution of that spirit — meticulous, fun, and deeply atmospheric."
