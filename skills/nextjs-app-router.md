# Next.js App Router Skills & Patterns for Rick's Cafe

> Comprehensive reference for building Rick's Cafe with the Next.js App Router,
> TypeScript strict mode, Sanity.io CMS, Framer Motion page transitions, and
> Vercel deployment. Tailored to the project's architecture described in
> `CLAUDE.md` and `context/PROJECT_MANUAL.md`.

---

## Table of Contents

1. [Project Scaffolding & Configuration](#1-project-scaffolding--configuration)
2. [Folder Structure](#2-folder-structure)
3. [Server vs Client Component Decision Tree](#3-server-vs-client-component-decision-tree)
4. [Data Fetching Patterns](#4-data-fetching-patterns)
5. [Sanity.io Integration](#5-sanityio-integration)
6. [Dynamic Routes & generateStaticParams](#6-dynamic-routes--generatestaticparams)
7. [Image Optimization](#7-image-optimization)
8. [Page Transitions with AnimatePresence](#8-page-transitions-with-animatepresence)
9. [SEO & Metadata API](#9-seo--metadata-api)
10. [JSON-LD Structured Data for Food Blogs](#10-json-ld-structured-data-for-food-blogs)
11. [Performance Optimization](#11-performance-optimization)
12. [Common Pitfalls & How to Avoid Them](#12-common-pitfalls--how-to-avoid-them)
13. [Vercel Deployment Notes](#13-vercel-deployment-notes)

---

## 1. Project Scaffolding & Configuration

### Current State

Rick's Cafe is already scaffolded with:
- Next.js 16.1.6, React 19.2.3
- TypeScript strict mode enabled in `tsconfig.json`
- Tailwind CSS 4 with PostCSS
- ESLint 9 with `eslint-config-next`
- Path alias `@/*` mapped to `./src/*`

### Dependencies Still Needed

Install the core project dependencies referenced in `CLAUDE.md`:

```bash
# CMS
npm install next-sanity @sanity/image-url @sanity/client

# Animations
npm install framer-motion gsap

# Smooth scrolling
npm install lenis

# Sanity TypeGen (dev)
npm install -D sanity
```

### TypeScript Configuration

The existing `tsconfig.json` already has `"strict": true`. For enhanced App Router
type safety, consider enabling typed routes in `next.config.ts`:

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

export default nextConfig;
```

With `typedRoutes: true`, Next.js generates route types so that `Link href` props
are checked at compile time. This catches broken links during development.

### Sanity TypeGen Setup

Add type generation scripts to `package.json`:

```json
{
  "scripts": {
    "predev": "npm run typegen",
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typegen": "sanity schema extract --path=src/sanity/extract.json && sanity typegen generate"
  }
}
```

---

## 2. Folder Structure

The following structure aligns with App Router conventions and the architecture
rules from `CLAUDE.md` (`/components`, `/lib`, `/hooks`, `/styles`, `/context`):

```
src/
  app/
    layout.tsx                    # Root layout (Server Component)
    template.tsx                  # Root template (for page transitions)
    page.tsx                      # Homepage ("/") - Timeline/World
    globals.css                   # Global styles / Tailwind imports
    favicon.ico
    opengraph-image.tsx           # Dynamic OG image generation
    sitemap.ts                    # Dynamic sitemap
    robots.ts                     # Robots config
    restaurant/
      [slug]/
        page.tsx                  # Restaurant detail page
        opengraph-image.tsx       # Per-restaurant OG image
        loading.tsx               # Streaming fallback
    about/
      page.tsx                    # About / story page
    (studio)/
      studio/
        [[...tool]]/
          page.tsx                # Embedded Sanity Studio
  components/
    layout/
      Header.tsx                  # Client Component (has interactions)
      Footer.tsx                  # Server Component
      LayoutTransition.tsx        # Client Component (AnimatePresence wrapper)
      FrozenRouter.tsx            # Client Component (page transition helper)
    restaurant/
      ScoreBreakdown.tsx          # Server Component (display only)
      LightboxGallery.tsx         # Client Component (interactive)
      RestaurantCard.tsx          # Server Component (used in lists)
    timeline/
      TimelineScroller.tsx        # Client Component (scroll-driven)
    ui/
      CustomCursor.tsx            # Client Component (mouse tracking)
      MagneticButton.tsx          # Client Component (hover animation)
  lib/
    sanity/
      client.ts                   # Sanity client configuration
      queries.ts                  # GROQ query definitions
      image.ts                    # Image URL builder utility
      fetch.ts                    # sanityFetch() helper with caching
      env.ts                      # Environment variable exports
    utils.ts                      # General utilities
  hooks/
    useMediaQuery.ts              # Responsive breakpoint hook
    usePrefersReducedMotion.ts    # Accessibility: respect motion prefs
    useLenis.ts                   # Lenis smooth scroll hook
  styles/
    fonts.ts                      # Font loading with next/font
  context/
    ThemeProvider.tsx              # Client Component wrapping children
  sanity/
    schemas/                      # Sanity schema definitions
      restaurant.ts
      review.ts
      gallery.ts
      index.ts
    sanity.config.ts
    sanity.cli.ts
```

### Key Conventions

- **`layout.tsx`** persists across navigations within its subtree. Use it for
  shared UI (nav, footer) and providers. It does NOT remount.
- **`template.tsx`** re-renders on every navigation. This is where AnimatePresence
  wraps page content for transitions.
- **`loading.tsx`** provides an instant loading UI via React Suspense while the
  page's server component fetches data.
- **`error.tsx`** (must be a Client Component) catches runtime errors in its subtree.
- **Route Groups** `(studio)` keep Sanity Studio routes separate without affecting
  the URL structure.
- **`opengraph-image.tsx`** auto-generates OG images per route segment.

---

## 3. Server vs Client Component Decision Tree

All components in the App Router are **Server Components by default**. Only add
`"use client"` when the component genuinely requires it.

### Use Server Components When:

- Displaying data (restaurant info, review text, scores)
- Fetching from Sanity (GROQ queries)
- Rendering images with `next/image` (no interactivity needed)
- Generating metadata
- Rendering static layouts, headers with no JS interactions
- Accessing server-only resources (env vars, databases)

### Use Client Components When:

- Using React hooks: `useState`, `useEffect`, `useRef`, `useContext`
- Handling DOM events: `onClick`, `onChange`, `onScroll`, `onMouseMove`
- Using browser APIs: `window`, `localStorage`, `IntersectionObserver`
- Using Framer Motion: `motion.*`, `AnimatePresence`, `useAnimation`
- Using GSAP: `gsap.to()`, `ScrollTrigger`
- Using Lenis smooth scrolling
- Custom cursor tracking
- Interactive galleries (lightbox, swipe)

### The "Leaf Node" Principle

Push `"use client"` directives as far down the component tree as possible.
Only the interactive leaf needs to be a Client Component -- its parent can remain
a Server Component.

```tsx
// app/restaurant/[slug]/page.tsx (SERVER COMPONENT -- no "use client")
import { ScoreBreakdown } from "@/components/restaurant/ScoreBreakdown";
import { LightboxGallery } from "@/components/restaurant/LightboxGallery";
import { getRestaurant } from "@/lib/sanity/fetch";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);

  return (
    <article>
      {/* Server Component -- just renders data */}
      <ScoreBreakdown scores={restaurant.scores} />

      {/* Client Component -- needs interactivity */}
      <LightboxGallery images={restaurant.gallery} />
    </article>
  );
}
```

### Composition Pattern: Server Children Inside Client Parents

Client Components cannot import Server Components, but they CAN receive them as
`children` (or any React node prop). This is essential for the layout transition
pattern:

```tsx
// components/layout/AnimatedWrapper.tsx
"use client";
import { motion } from "framer-motion";

export function AnimatedWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {children}  {/* These children can be Server Components */}
    </motion.div>
  );
}
```

---

## 4. Data Fetching Patterns

### Pattern 1: Direct Fetch in Server Components (Primary Pattern)

This is the default for Rick's Cafe. Server Components are async, so fetch data
directly -- no `useEffect`, no loading states needed at the component level.

```tsx
// app/page.tsx (Server Component)
import { sanityFetch } from "@/lib/sanity/fetch";
import { RESTAURANTS_QUERY } from "@/lib/sanity/queries";

export default async function HomePage() {
  const restaurants = await sanityFetch({
    query: RESTAURANTS_QUERY,
    tags: ["restaurant"],
  });

  return <TimelineView restaurants={restaurants} />;
}
```

### Pattern 2: Parallel Data Fetching

When a page needs multiple independent datasets, fetch them in parallel to avoid
waterfall delays:

```tsx
export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Parallel fetches -- no waterfall
  const [restaurant, relatedPosts] = await Promise.all([
    sanityFetch({ query: RESTAURANT_QUERY, params: { slug }, tags: ["restaurant"] }),
    sanityFetch({ query: RELATED_POSTS_QUERY, params: { slug }, tags: ["post"] }),
  ]);

  return (
    <>
      <RestaurantDetail data={restaurant} />
      <RelatedPosts posts={relatedPosts} />
    </>
  );
}
```

### Pattern 3: Streaming with Suspense

For heavy pages where some sections can load independently, wrap slower sections
in Suspense boundaries:

```tsx
import { Suspense } from "react";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);

  return (
    <article>
      <RestaurantHero restaurant={restaurant} />

      {/* Gallery loads independently -- shows skeleton first */}
      <Suspense fallback={<GallerySkeleton />}>
        <GallerySection slug={slug} />
      </Suspense>
    </article>
  );
}

// This is a separate async Server Component
async function GallerySection({ slug }: { slug: string }) {
  const gallery = await getGallery(slug);
  return <LightboxGallery images={gallery} />;
}
```

**Important**: The Suspense boundary must wrap the async component from the
outside. Placing `<Suspense>` inside the async component does nothing.

### Pattern 4: Memoized Fetch with React `cache()`

When the same data is needed by both `generateMetadata` and the page component,
use React's `cache()` to deduplicate:

```tsx
// lib/sanity/fetch.ts
import { cache } from "react";
import { client } from "./client";

export const getRestaurant = cache(async (slug: string) => {
  return client.fetch(RESTAURANT_QUERY, { slug });
});
```

Both `generateMetadata` and the page component can call `getRestaurant(slug)` and
the actual fetch executes only once per request.

### Pattern 5: Revalidation Strategies

**Time-based** (good default for Rick's Cafe -- content updates infrequently):

```tsx
// Revalidate every 60 seconds
const data = await fetch(url, { next: { revalidate: 60 } });
```

**Tag-based** (fine-grained, pairs with Sanity webhooks):

```tsx
const data = await client.fetch(query, params, {
  next: { tags: ["restaurant"] },
});

// In a webhook handler or Server Action:
import { revalidateTag } from "next/cache";
revalidateTag("restaurant");
```

**On-demand via Route Handler** (triggered by Sanity webhook on content publish):

```tsx
// app/api/revalidate/route.ts
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const tag = body._type; // e.g., "restaurant"
  revalidateTag(tag);
  return NextResponse.json({ revalidated: true, tag });
}
```

### What NOT to Do

- Do NOT create Route Handlers just to fetch data for Server Components. Server
  Components can fetch directly -- the extra network hop is wasteful.
- Do NOT use `useEffect` + `fetch` in Client Components for initial data. Pass
  the data down from a parent Server Component instead.
- Route Handlers are appropriate for: webhook endpoints, form submissions from
  external services, and APIs consumed by third parties.

---

## 5. Sanity.io Integration

### Client Setup

```tsx
// src/lib/sanity/env.ts
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-07-11";
```

```tsx
// src/lib/sanity/client.ts
import { createClient } from "next-sanity";
import { projectId, dataset, apiVersion } from "./env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Set to false when using revalidation (ISR/tag-based).
  // Set to true only for fully static builds or when fresh data is not critical.
  useCdn: false,
});
```

### GROQ Queries with Type Safety

```tsx
// src/lib/sanity/queries.ts
import { defineQuery } from "next-sanity";

// List of restaurants for the timeline
export const RESTAURANTS_QUERY = defineQuery(`
  *[_type == "restaurant" && defined(slug.current)] | order(visitDate desc) {
    _id,
    title,
    slug,
    visitDate,
    heroImage,
    neighborhood,
    "averageScore": math::avg([
      scores.taste,
      scores.vibe,
      scores.service,
      scores.value,
      scores.rickFactor
    ])
  }
`);

// Single restaurant detail
export const RESTAURANT_QUERY = defineQuery(`
  *[_type == "restaurant" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    visitDate,
    heroImage,
    body,
    neighborhood,
    cuisine,
    priceRange,
    scores {
      taste,
      vibe,
      service,
      value,
      rickFactor
    },
    gallery[] {
      asset->,
      caption,
      alt
    }
  }
`);

// All slugs for static generation
export const RESTAURANT_SLUGS_QUERY = defineQuery(`
  *[_type == "restaurant" && defined(slug.current)]{
    "slug": slug.current
  }
`);
```

Wrapping queries in `defineQuery` enables:
- Syntax highlighting in VS Code with the Sanity extension
- Automatic TypeScript type inference via Sanity TypeGen

### Centralized Fetch Helper with Caching

```tsx
// src/lib/sanity/fetch.ts
import { client } from "./client";
import type { QueryParams } from "next-sanity";

export async function sanityFetch<const QueryString extends string>({
  query,
  params = {},
  revalidate = 60,
  tags = [],
}: {
  query: QueryString;
  params?: QueryParams;
  revalidate?: number | false;
  tags?: string[];
}) {
  return client.fetch(query, params, {
    cache: revalidate === false ? "no-store" : "force-cache",
    next: {
      revalidate: tags.length ? false : revalidate,
      tags,
    },
  });
}
```

**Strategy**: Use tag-based revalidation (`tags: ["restaurant"]`) combined with
a Sanity webhook that calls `/api/revalidate` on content publish. This gives
instant updates when Rick publishes a new review, without rebuilding the entire
site.

### Image URL Builder

```tsx
// src/lib/sanity/image.ts
import imageUrlBuilder from "@sanity/image-url";
import { client } from "./client";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
```

Usage:

```tsx
import { urlFor } from "@/lib/sanity/image";

// In a component
<Image
  src={urlFor(restaurant.heroImage).width(1200).height(800).url()}
  alt={restaurant.title}
  width={1200}
  height={800}
  quality={85}
/>
```

### Environment Variables

Create `.env.local` (never commit this):

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-07-11
SANITY_WEBHOOK_SECRET=your_webhook_secret
```

---

## 6. Dynamic Routes & generateStaticParams

### Restaurant Detail Route

```
src/app/restaurant/[slug]/page.tsx
```

### generateStaticParams for Build-Time Generation

```tsx
// src/app/restaurant/[slug]/page.tsx
import { sanityFetch } from "@/lib/sanity/fetch";
import { RESTAURANT_SLUGS_QUERY, RESTAURANT_QUERY } from "@/lib/sanity/queries";

// Generate static pages for all known restaurants at build time
export async function generateStaticParams() {
  const restaurants = await sanityFetch({
    query: RESTAURANT_SLUGS_QUERY,
    revalidate: false, // Only runs at build time
  });

  return restaurants.map((r: { slug: string }) => ({
    slug: r.slug,
  }));
}

// Control behavior for slugs NOT returned by generateStaticParams
// true  = render on-demand and cache (good for new restaurants added after build)
// false = return 404 for unknown slugs
export const dynamicParams = true;

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const restaurant = await sanityFetch({
    query: RESTAURANT_QUERY,
    params: { slug },
    tags: ["restaurant"],
  });

  if (!restaurant) {
    notFound();
  }

  return (
    <article>
      <h1>{restaurant.title}</h1>
      {/* ... */}
    </article>
  );
}
```

### Important Notes on `params` in Next.js 15+

In Next.js 15 and later, `params` is a **Promise**. You must `await` it:

```tsx
// Correct (Next.js 15+)
const { slug } = await params;

// Wrong (will break in future versions)
const { slug } = params; // synchronous access is deprecated
```

### loading.tsx for Instant Feedback

```tsx
// src/app/restaurant/[slug]/loading.tsx
export default function RestaurantLoading() {
  return (
    <div className="animate-pulse space-y-4 p-8">
      <div className="h-[60vh] bg-neutral-200 rounded-lg" />
      <div className="h-8 w-1/2 bg-neutral-200 rounded" />
      <div className="h-4 w-3/4 bg-neutral-200 rounded" />
    </div>
  );
}
```

This renders immediately while the page's async Server Component resolves.

---

## 7. Image Optimization

### next.config.ts Configuration

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
    // Prefer AVIF for best compression, fall back to WebP
    formats: ["image/avif", "image/webp"],
    // Define responsive breakpoints for srcset generation
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
```

### Usage Patterns

**Hero Images (known dimensions)**:

```tsx
import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";

export function RestaurantHero({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="relative w-full h-[70vh]">
      <Image
        src={urlFor(restaurant.heroImage).width(1920).height(1080).url()}
        alt={restaurant.title}
        fill
        sizes="100vw"
        priority  // Above the fold -- load immediately, skip lazy loading
        className="object-cover"
        quality={85}
      />
    </div>
  );
}
```

**Gallery Thumbnails (responsive grid)**:

```tsx
export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((img, i) => (
        <div key={img.asset._id} className="relative aspect-square">
          <Image
            src={urlFor(img.asset).width(600).height(600).url()}
            alt={img.alt || "Restaurant photo"}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover rounded-lg"
            // Only prioritize the first 4 visible images
            loading={i < 4 ? "eager" : "lazy"}
          />
        </div>
      ))}
    </div>
  );
}
```

### Critical Optimization Rules

1. **Always set `sizes`**. Without it, Next.js assumes the image is 100vw wide
   and generates unnecessarily large srcsets. For a 3-column grid, use
   `sizes="(max-width: 768px) 50vw, 33vw"`.

2. **Use `priority` only for above-the-fold images** (hero, first visible card).
   This disables lazy loading and preloads the image.

3. **Use `fill` for responsive containers** where the image should fill the parent.
   The parent must have `position: relative` and defined dimensions.

4. **Set `quality` between 75-85** for photographs. Default is 75. Food photography
   often benefits from 80-85 for richer colors without excessive file size.

5. **Use Sanity's image pipeline** (`urlFor().width().height()`) to request
   appropriately sized images from the CDN. Then Next.js optimizes further on
   delivery. This two-stage pipeline (Sanity CDN crops/resizes -> Next.js serves
   AVIF/WebP at exact device size) minimizes bandwidth.

6. **Avoid layout shift**: Always provide `width`+`height` or use `fill` with a
   sized parent. Never let images load without reserved space.

### Blur Placeholder for Progressive Loading

```tsx
// For Sanity images, generate a low-quality placeholder
const blurUrl = urlFor(image).width(20).height(20).blur(50).url();

<Image
  src={urlFor(image).width(800).height(600).url()}
  alt="Dish photo"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL={blurUrl}
/>
```

---

## 8. Page Transitions with AnimatePresence

This is the trickiest part of the App Router architecture. AnimatePresence needs
to detect when children are removed from the tree to play exit animations, but
the App Router eagerly unmounts pages on navigation.

### The Solution: FrozenRouter + LayoutTransition

This pattern uses:
- `template.tsx` (re-renders on navigation, unlike `layout.tsx`)
- A `FrozenRouter` component that preserves the previous route's React context
  during the exit animation
- `useSelectedLayoutSegment` as the animation key

#### Step 1: FrozenRouter Component

```tsx
// src/components/layout/FrozenRouter.tsx
"use client";

import { useContext, useRef, useEffect } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

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

export function FrozenRouter({ children }: { children: React.ReactNode }) {
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
```

#### Step 2: LayoutTransition Wrapper

```tsx
// src/components/layout/LayoutTransition.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSelectedLayoutSegment } from "next/navigation";
import { FrozenRouter } from "./FrozenRouter";

interface LayoutTransitionProps {
  children: React.ReactNode;
  className?: string;
  initial?: object;
  animate?: object;
  exit?: object;
  transition?: object;
}

export function LayoutTransition({
  children,
  className,
  initial = { opacity: 0 },
  animate = { opacity: 1 },
  exit = { opacity: 0 },
  transition = { duration: 0.3, ease: "easeInOut" },
}: LayoutTransitionProps) {
  const segment = useSelectedLayoutSegment();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={segment}
        className={className}
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

#### Step 3: Use in Root Layout

```tsx
// src/app/layout.tsx (Server Component)
import { LayoutTransition } from "@/components/layout/LayoutTransition";
import { Header } from "@/components/layout/Header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <LayoutTransition
          className="min-h-screen"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </LayoutTransition>
      </body>
    </html>
  );
}
```

### Respecting Reduced Motion

Per `CLAUDE.md`: "Animations should respect `prefers-reduced-motion`."

```tsx
// src/hooks/usePrefersReducedMotion.ts
"use client";

import { useEffect, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}
```

Then in LayoutTransition, disable animations when the user prefers reduced motion:

```tsx
const prefersReducedMotion = usePrefersReducedMotion();

const motionProps = prefersReducedMotion
  ? { initial: false, animate: {}, exit: {} }
  : { initial, animate, exit, transition };
```

### Known Limitations

- **`LayoutRouterContext` is an internal Next.js API**. It is not part of the
  public API and may change between Next.js versions. Pin your Next.js version
  and test after upgrades.
- **Exit animations delay navigation**. Keep them short (200-400ms) to avoid
  feeling sluggish. The `mode="wait"` on AnimatePresence means the new page
  won't render until the exit animation completes.
- **Nested layouts**: If you need different transitions for different sections,
  place additional `LayoutTransition` wrappers in nested layouts with different
  animation configs.

---

## 9. SEO & Metadata API

### Static Metadata (Root Layout)

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://rickscafe.com"),
  title: {
    default: "Rick's Cafe | An Immersive Food Blog",
    template: "%s | Rick's Cafe",
  },
  description:
    "An immersive food blog exploring restaurants through taste, vibe, service, value, and the Rick Factor.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Rick's Cafe",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@rickscafe",
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

The `title.template` is inherited by child pages. When a child page sets
`title: "Le Bernardin"`, the browser tab shows `"Le Bernardin | Rick's Cafe"`.

### Dynamic Metadata for Restaurant Pages

```tsx
// src/app/restaurant/[slug]/page.tsx
import type { Metadata } from "next";
import { getRestaurant } from "@/lib/sanity/fetch";
import { urlFor } from "@/lib/sanity/image";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);

  if (!restaurant) {
    return { title: "Restaurant Not Found" };
  }

  const ogImageUrl = restaurant.heroImage
    ? urlFor(restaurant.heroImage).width(1200).height(630).url()
    : undefined;

  return {
    title: restaurant.title,
    description: `Rick's review of ${restaurant.title} in ${restaurant.neighborhood}. ${restaurant.cuisine} cuisine.`,
    openGraph: {
      title: `${restaurant.title} | Rick's Cafe`,
      description: `Rick's review of ${restaurant.title}`,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630 }] : [],
    },
  };
}
```

### Dynamic Sitemap

```tsx
// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { sanityFetch } from "@/lib/sanity/fetch";
import { RESTAURANT_SLUGS_QUERY } from "@/lib/sanity/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const restaurants = await sanityFetch({
    query: RESTAURANT_SLUGS_QUERY,
    revalidate: 3600,
  });

  const restaurantUrls = restaurants.map(
    (r: { slug: string }) => ({
      url: `https://rickscafe.com/restaurant/${r.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })
  );

  return [
    {
      url: "https://rickscafe.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://rickscafe.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...restaurantUrls,
  ];
}
```

### robots.ts

```tsx
// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/studio/", "/api/"],
    },
    sitemap: "https://rickscafe.com/sitemap.xml",
  };
}
```

### Dynamic OG Image Generation

```tsx
// src/app/restaurant/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { getRestaurant } from "@/lib/sanity/fetch";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: { slug: string };
}) {
  const restaurant = await getRestaurant(params.slug);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
          color: "white",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.7, marginBottom: 12 }}>
          Rick's Cafe
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
          {restaurant?.title || "Restaurant"}
        </div>
        <div style={{ fontSize: 28, marginTop: 16, opacity: 0.8 }}>
          {restaurant?.neighborhood} &middot; {restaurant?.cuisine}
        </div>
      </div>
    ),
    { ...size }
  );
}
```

---

## 10. JSON-LD Structured Data for Food Blogs

JSON-LD gives search engines rich context about your content. For a food blog,
the `Restaurant` and `Review` schemas are most valuable. Include these as
`<script>` tags in your Server Components.

### Restaurant + Review Schema

```tsx
// src/app/restaurant/[slug]/page.tsx
export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await getRestaurant(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.title,
    image: urlFor(restaurant.heroImage).width(1200).height(800).url(),
    address: {
      "@type": "PostalAddress",
      addressLocality: restaurant.neighborhood,
    },
    servesCuisine: restaurant.cuisine,
    priceRange: restaurant.priceRange,
    review: {
      "@type": "Review",
      author: {
        "@type": "Person",
        name: "Rick",
      },
      reviewBody: restaurant.summary,
      reviewRating: {
        "@type": "Rating",
        ratingValue: restaurant.averageScore,
        bestRating: 10,
        worstRating: 0,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>
        {/* Page content */}
      </article>
    </>
  );
}
```

### Website-Level Schema (Root Layout)

```tsx
// In src/app/layout.tsx
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Rick's Cafe",
  url: "https://rickscafe.com",
  description: "An immersive food blog exploring the world of dining.",
  author: {
    "@type": "Person",
    name: "Rick",
  },
};

// Render in the <body>:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
/>
```

### Validation

Test your structured data at:
- https://search.google.com/test/rich-results
- https://validator.schema.org/

---

## 11. Performance Optimization

### Checklist for Image-Heavy Food Blog

1. **Use AVIF format**: Set `formats: ["image/avif", "image/webp"]` in
   `next.config.ts`. AVIF offers 50% better compression than WebP for photos.

2. **Lazy load below-the-fold images**: Only the hero and first visible row
   should have `priority` or `loading="eager"`. Everything else lazy-loads by
   default.

3. **Right-size images with `sizes` prop**: Tell the browser how wide each image
   will actually be at each breakpoint, so it picks the smallest sufficient file.

4. **Use Sanity's image pipeline for crops**: Request only the dimensions you
   need from `urlFor().width(x).height(y)` rather than downloading full-res
   originals.

5. **Blur placeholders**: Use low-quality blur data URLs for progressive loading
   of hero images and gallery items.

6. **Avoid unnecessary Client Components**: Every `"use client"` adds to the JS
   bundle. The restaurant detail page's score breakdown, body text, and metadata
   can all be Server Components -- zero JS shipped.

7. **Use Suspense for streaming**: Wrap independent sections in `<Suspense>` so
   the browser can start painting before all data resolves.

8. **Font optimization**: Use `next/font` to self-host fonts. Avoid layout shift
   from font loading:

   ```tsx
   // src/styles/fonts.ts
   import { Playfair_Display, Inter } from "next/font/google";

   export const playfair = Playfair_Display({
     subsets: ["latin"],
     display: "swap",
     variable: "--font-playfair",
   });

   export const inter = Inter({
     subsets: ["latin"],
     display: "swap",
     variable: "--font-inter",
   });
   ```

   Apply in root layout:
   ```tsx
   <body className={`${playfair.variable} ${inter.variable}`}>
   ```

9. **Bundle analysis**: Run `ANALYZE=true next build` with
   `@next/bundle-analyzer` to identify heavy client-side imports.

10. **Prefetch critical routes**: Next.js `<Link>` prefetches by default on
    viewport intersection. For the timeline, restaurant cards will automatically
    prefetch their detail pages as they scroll into view.

---

## 12. Common Pitfalls & How to Avoid Them

### Pitfall 1: Adding "use client" Everywhere

**Symptom**: Most of your components are Client Components. Bundle size is large.

**Fix**: Start with Server Components. Only add `"use client"` to the specific
leaf component that needs interactivity. Restructure to pass data down from
Server Component parents.

### Pitfall 2: Fetching Data via Route Handlers for Server Components

**Wrong**:
```tsx
// Server Component
export default async function Page() {
  const res = await fetch("http://localhost:3000/api/restaurants");
  const data = await res.json();
  // ...
}
```

**Right**:
```tsx
export default async function Page() {
  const data = await sanityFetch({ query: RESTAURANTS_QUERY, tags: ["restaurant"] });
  // ...
}
```

Server Components run on the server -- they can access data sources directly.
The Route Handler round-trip adds latency for no benefit.

### Pitfall 3: Suspense Boundary Placement

**Wrong** (Suspense inside the async component):
```tsx
async function RestaurantList() {
  const data = await fetchRestaurants();
  return (
    <Suspense fallback={<Loading />}>
      <ul>{/* ... */}</ul>
    </Suspense>
  );
}
```

**Right** (Suspense wraps the async component from outside):
```tsx
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <RestaurantList />
    </Suspense>
  );
}
```

### Pitfall 4: Redirect Inside Try/Catch

`redirect()` throws internally. If you catch it, the redirect silently fails.

```tsx
// Wrong
try {
  if (!data) redirect("/404");
} catch (e) {
  console.error(e); // catches the redirect "error"
}

// Right
const data = await fetchData();
if (!data) redirect("/404");  // Outside try/catch
```

### Pitfall 5: Context Providers Blocking Server Components

**Wrong** (layout becomes a Client Component):
```tsx
"use client";
export default function Layout({ children }) {
  return <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>;
}
```

**Right** (separate Client Component for the provider):
```tsx
// context/ThemeProvider.tsx
"use client";
import { createContext } from "react";
export const ThemeContext = createContext({});
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>;
}

// app/layout.tsx (stays a Server Component)
import { ThemeProvider } from "@/context/ThemeProvider";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html><body>
      <ThemeProvider>{children}</ThemeProvider>
    </body></html>
  );
}
```

### Pitfall 6: Forgetting to Revalidate After Mutations

When Rick publishes a new restaurant review in Sanity, the cached pages won't
update unless you revalidate.

**Solution**: Set up a Sanity webhook pointing to `/api/revalidate` that calls
`revalidateTag("restaurant")`. See the Route Handler in
[Section 4](#pattern-5-revalidation-strategies).

### Pitfall 7: Not Awaiting `params` in Next.js 15+

```tsx
// Will work now but is deprecated and will break:
const slug = params.slug;

// Correct:
const { slug } = await params;
```

### Pitfall 8: Using `useSearchParams` in Server Components

Server Components cannot use hooks. Use the `searchParams` prop instead:

```tsx
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { cuisine } = await searchParams;
  // ...
}
```

### Pitfall 9: Missing `sizes` on `next/image`

Without `sizes`, the browser assumes 100vw and downloads the largest available
image. On a 3-column grid, you're downloading 3x more data than needed.

```tsx
// Always specify sizes for responsive images
<Image sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
```

### Pitfall 10: Importing Server Components in Client Components

This will NOT work:
```tsx
"use client";
import { ServerWidget } from "./ServerWidget"; // This becomes a Client Component!
```

Use the composition pattern instead -- pass Server Components as `children` or
other React node props to Client Components.

---

## 13. Vercel Deployment Notes

### Automatic Optimizations

Vercel provides automatic:
- Image optimization (serves AVIF/WebP at edge)
- ISR (Incremental Static Regeneration) support
- Edge caching of static and revalidated pages
- Automatic HTTPS and CDN

### Environment Variables

Set in Vercel dashboard (Settings > Environment Variables):
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_API_VERSION`
- `SANITY_WEBHOOK_SECRET`

### Build Configuration

Vercel auto-detects Next.js. No special build settings needed. Ensure:
- Root directory is set correctly if using a monorepo
- Node.js version is 18+ (Vercel default)
- Build command: `next build` (default)

### Webhook Setup

In the Sanity dashboard, create a webhook:
- **URL**: `https://rickscafe.com/api/revalidate`
- **Trigger**: On create, update, delete
- **Filter**: `_type in ["restaurant", "review"]`
- **Secret**: Use the `SANITY_WEBHOOK_SECRET` env var for verification

### Preview Deployments

Every git push to a non-production branch creates a preview deployment.
Use these to review restaurant pages before publishing.

---

## Quick Reference: File Conventions

| File              | Purpose                                      | Server/Client |
|-------------------|----------------------------------------------|---------------|
| `layout.tsx`      | Shared UI, persists across navigations       | Server        |
| `template.tsx`    | Re-renders on navigation (for transitions)   | Server*       |
| `page.tsx`        | Unique page UI, maps to a route              | Server        |
| `loading.tsx`     | Suspense fallback while page loads           | Server        |
| `error.tsx`       | Error boundary for the route segment         | Client        |
| `not-found.tsx`   | 404 UI for the route segment                 | Server        |
| `route.ts`        | API endpoint (Route Handler)                 | Server        |
| `sitemap.ts`      | Dynamic sitemap generation                   | Server        |
| `robots.ts`       | Robots.txt generation                        | Server        |
| `opengraph-image` | OG image generation                          | Server        |

*`template.tsx` is a Server Component, but the transition wrapper it renders
(`LayoutTransition`) is a Client Component.

---

## Sources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js Image Optimization](https://nextjs.org/docs/app/getting-started/images)
- [Next.js Caching and Revalidation](https://nextjs.org/docs/app/getting-started/caching-and-revalidating)
- [Next.js generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [Next.js JSON-LD Guide](https://nextjs.org/docs/app/guides/json-ld)
- [next-sanity GitHub Repository](https://github.com/sanity-io/next-sanity)
- [Sanity Visual Editing with Next.js App Router](https://www.sanity.io/guides/nextjs-app-router-live-preview)
- [Solving Framer Motion Page Transitions in Next.js App Router](https://www.imcorfitz.com/posts/adding-framer-motion-page-transitions-to-next-js-app-router)
- [Common Mistakes with Next.js App Router (Vercel Blog)](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
