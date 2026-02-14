# Deployment & Performance Optimization Skills

## Rick's Cafe - Next.js on Vercel with Sanity CMS

This skills document covers Vercel deployment, performance optimization, caching strategies,
image pipelines, and monitoring for an animation-heavy, image-rich food blog built with
Next.js App Router and Sanity CMS.

---

## Table of Contents

1. [Vercel Project Setup & Configuration](#1-vercel-project-setup--configuration)
2. [Environment Variable Management](#2-environment-variable-management)
3. [ISR & Revalidation Strategies with Sanity Webhooks](#3-isr--revalidation-strategies-with-sanity-webhooks)
4. [Image Optimization Pipeline](#4-image-optimization-pipeline)
5. [Core Web Vitals Optimization](#5-core-web-vitals-optimization)
6. [Bundle Size Analysis & Tree-Shaking](#6-bundle-size-analysis--tree-shaking)
7. [Caching Headers & CDN Configuration](#7-caching-headers--cdn-configuration)
8. [Preview Deployment Workflow for Content Editors](#8-preview-deployment-workflow-for-content-editors)
9. [Performance Monitoring & Analytics](#9-performance-monitoring--analytics)
10. [Edge Middleware Use Cases](#10-edge-middleware-use-cases)
11. [Loading Strategies](#11-loading-strategies)
12. [Font Optimization](#12-font-optimization)
13. [Animation Performance Pitfalls](#13-animation-performance-pitfalls)
14. [Performance Budgets](#14-performance-budgets)

---

## 1. Vercel Project Setup & Configuration

### vercel.json

For Next.js App Router projects, prefer configuring headers, redirects, and rewrites in
`next.config.ts` rather than `vercel.json`. Vercel auto-detects Next.js and applies
optimal build settings. Use `vercel.json` only for Vercel-specific settings.

```jsonc
// vercel.json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "regions": ["iad1"],
  "crons": [
    {
      "path": "/api/cron/revalidate-sitemap",
      "schedule": "0 0 * * *"
    }
  ],
  "headers": [
    {
      "source": "/fonts/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### next.config.ts (Recommended Primary Configuration)

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year for immutable CDN images
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Redirects for old URLs
  async redirects() {
    return [
      {
        source: "/blog/:slug",
        destination: "/recipes/:slug",
        permanent: true,
      },
    ];
  },

  // Package import optimization for large libraries
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "@sanity/icons",
    ],
  },
};

export default nextConfig;
```

### Recommended Vercel Dashboard Settings

- **Build Command**: `next build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Node.js Version**: 20.x (LTS)
- **Function Region**: `iad1` (US East) or closest to your primary audience
- **Deployment Protection**: Enable for Preview deployments
- **Skew Protection**: Enable for zero-downtime deployments

---

## 2. Environment Variable Management

### Variable Categories

| Variable | Environments | Prefix | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | All | `NEXT_PUBLIC_` | Sanity project ID (client-safe) |
| `NEXT_PUBLIC_SANITY_DATASET` | All | `NEXT_PUBLIC_` | Sanity dataset name |
| `NEXT_PUBLIC_SANITY_API_VERSION` | All | `NEXT_PUBLIC_` | API version date |
| `SANITY_API_READ_TOKEN` | All (server) | None | Server-side read token |
| `SANITY_REVALIDATE_SECRET` | Production, Preview | None | Webhook signature secret |
| `SANITY_API_WRITE_TOKEN` | Preview only | None | For preview/draft mutations |
| `NEXT_PUBLIC_VERCEL_URL` | Auto-set | `NEXT_PUBLIC_` | Deployment URL |
| `VERCEL_ENV` | Auto-set | None | `production`, `preview`, or `development` |

### Environment-Specific Configuration

```typescript
// src/lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SANITY_DATASET: z.string().default("production"),
  NEXT_PUBLIC_SANITY_API_VERSION: z.string().default("2025-01-01"),
  SANITY_API_READ_TOKEN: z.string().min(1),
  SANITY_REVALIDATE_SECRET: z.string().min(1),
});

// Validate at build time - fail fast if missing
export const env = envSchema.parse({
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
  SANITY_REVALIDATE_SECRET: process.env.SANITY_REVALIDATE_SECRET,
});
```

### Dataset Switching Per Environment

```typescript
// src/lib/sanity/config.ts
export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: getDataset(),
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  useCdn: process.env.VERCEL_ENV === "production",
};

function getDataset(): string {
  // Preview deployments can use a staging dataset
  if (process.env.VERCEL_ENV === "preview") {
    return process.env.NEXT_PUBLIC_SANITY_DATASET_PREVIEW || "staging";
  }
  return process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
}
```

### Local Development (.env.local)

```bash
# .env.local (never commit this file)
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-01
SANITY_API_READ_TOKEN=sk...
SANITY_REVALIDATE_SECRET=your-secret-here
SANITY_API_WRITE_TOKEN=sk...
```

### Critical Rule

After adding or changing environment variables in the Vercel dashboard, you **must
redeploy** your application. Variables are injected at build/deploy time. If you read a
variable that was added after the current deployment, its value will be `undefined`.

---

## 3. ISR & Revalidation Strategies with Sanity Webhooks

### Strategy Overview

| Strategy | Use Case | Freshness | Cost |
|---|---|---|---|
| Static (no revalidate) | Legal pages, about | Build-time only | Lowest |
| Time-based ISR | Category pages, listings | Periodic (60-3600s) | Low |
| On-demand (tag-based) | Recipe pages, blog posts | Near-instant | Medium |
| On-demand (path-based) | Specific URL invalidation | Near-instant | Medium |
| Dynamic (no-store) | Search, personalized | Real-time | Highest |

### Time-Based ISR in App Router

```typescript
// src/app/recipes/page.tsx
// This page revalidates every 60 seconds
export const revalidate = 60;

export default async function RecipesPage() {
  const recipes = await sanityFetch({
    query: allRecipesQuery,
    tags: ["recipe"],
  });

  return <RecipeGrid recipes={recipes} />;
}
```

### Tag-Based Fetch Wrapper

```typescript
// src/lib/sanity/fetch.ts
import { createClient } from "next-sanity";
import { sanityConfig } from "./config";

const client = createClient(sanityConfig);

interface SanityFetchOptions {
  query: string;
  params?: Record<string, unknown>;
  tags?: string[];
  revalidate?: number | false;
}

export async function sanityFetch<T>({
  query,
  params = {},
  tags = [],
  revalidate = false,
}: SanityFetchOptions): Promise<T> {
  return client.fetch<T>(query, params, {
    next: {
      revalidate,
      tags,
    },
  });
}
```

### On-Demand Revalidation API Route (Tag-Based)

```typescript
// src/app/api/revalidate/route.ts
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

// Secret configured in Sanity webhook and Vercel env vars
const revalidateSecret = process.env.SANITY_REVALIDATE_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature from Sanity
    const { body, isValidSignature } = await parseBody<{
      _type: string;
      _id: string;
      slug?: { current: string };
    }>(req, revalidateSecret);

    if (!isValidSignature) {
      return new NextResponse("Invalid signature", { status: 401 });
    }

    if (!body?._type) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Tag-based revalidation: invalidate all caches tagged with this type
    revalidateTag(body._type);

    // Also revalidate specific slug if available
    if (body.slug?.current) {
      revalidateTag(`${body._type}:${body.slug.current}`);
    }

    // Revalidate common tags that might reference this content
    revalidateTag("navigation");
    revalidateTag("sitemap");

    return NextResponse.json({
      status: 200,
      revalidated: true,
      now: Date.now(),
      body,
    });
  } catch (err) {
    console.error("Revalidation error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
```

### On-Demand Revalidation API Route (Path-Based)

```typescript
// src/app/api/revalidate-path/route.ts
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

export async function POST(req: NextRequest) {
  try {
    const { body, isValidSignature } = await parseBody<{
      _type: string;
      slug?: { current: string };
    }>(req, process.env.SANITY_REVALIDATE_SECRET);

    if (!isValidSignature) {
      return new NextResponse("Invalid signature", { status: 401 });
    }

    if (!body?._type) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Map Sanity document types to URL paths
    const pathMap: Record<string, (slug?: string) => string[]> = {
      recipe: (slug) => [
        `/recipes/${slug}`,
        "/recipes",
        "/",
      ],
      category: () => ["/recipes", "/"],
      author: (slug) => [`/chefs/${slug}`, "/about"],
      siteSettings: () => ["/", "/about", "/contact"],
    };

    const getPaths = pathMap[body._type];
    if (getPaths) {
      const paths = getPaths(body.slug?.current);
      paths.forEach((path) => revalidatePath(path));
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    console.error("Revalidation error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
```

### Sanity Webhook Configuration

Configure in Sanity at **manage.sanity.io > Project > API > Webhooks**:

| Setting | Value |
|---|---|
| **Name** | Revalidate Next.js Cache |
| **URL** | `https://ricks-cafe.vercel.app/api/revalidate` |
| **Dataset** | production |
| **Trigger on** | Create, Update, Delete |
| **Filter** | `_type in ["recipe", "category", "author", "siteSettings"]` |
| **Projection** | `{_type, _id, "slug": slug}` |
| **Secret** | Same as `SANITY_REVALIDATE_SECRET` env var |
| **HTTP method** | POST |
| **API version** | v2021-03-25 |
| **Enabled** | Yes |

### Tag-Based Fetching in Pages

```typescript
// src/app/recipes/[slug]/page.tsx
import { sanityFetch } from "@/lib/sanity/fetch";
import { recipeBySlugQuery } from "@/lib/sanity/queries";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function RecipePage({ params }: Props) {
  const { slug } = await params;

  const recipe = await sanityFetch<Recipe | null>({
    query: recipeBySlugQuery,
    params: { slug },
    // These tags get invalidated by the webhook
    tags: ["recipe", `recipe:${slug}`],
  });

  if (!recipe) notFound();

  return <RecipeDetail recipe={recipe} />;
}
```

---

## 4. Image Optimization Pipeline

### Architecture

The image pipeline has three layers:

1. **Sanity Image CDN** - Crops, resizes, and format-converts on the fly
2. **next/image** - Handles responsive sizes, lazy loading, and blur placeholders
3. **Vercel Image Optimization** - Final optimization and edge caching

### Sanity Image URL Builder

```typescript
// src/lib/sanity/image.ts
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { createClient } from "next-sanity";
import { sanityConfig } from "./config";

const client = createClient(sanityConfig);
const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

/**
 * Build an optimized image URL from Sanity.
 * Applies auto-format (WebP/AVIF based on Accept header), quality,
 * and optional dimensions while respecting hotspot/crop metadata.
 */
export function getImageUrl(
  source: SanityImageSource,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  let img = builder
    .image(source)
    .auto("format") // Serve WebP or AVIF based on browser support
    .quality(options?.quality ?? 75);

  if (options?.width) img = img.width(options.width);
  if (options?.height) img = img.height(options.height);

  return img.url();
}
```

### Custom Sanity Image Loader for next/image

```typescript
// src/lib/sanity/image-loader.ts
import type { ImageLoaderProps } from "next/image";

/**
 * Custom loader that tells next/image to request images from Sanity CDN.
 * This avoids double-optimization (Sanity already optimizes).
 *
 * Usage: <Image loader={sanityImageLoader} src={imageUrl} ... />
 *
 * Or configure globally in next.config.ts:
 *   images: { loader: 'custom', loaderFile: './src/lib/sanity/image-loader.ts' }
 */
export default function sanityImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  const url = new URL(src);

  // Sanity CDN parameters
  url.searchParams.set("w", width.toString());
  url.searchParams.set("q", (quality || 75).toString());
  url.searchParams.set("auto", "format"); // WebP/AVIF auto-negotiation
  url.searchParams.set("fit", "max");

  return url.toString();
}
```

### Reusable SanityImage Component

```tsx
// src/components/ui/sanity-image.tsx
import Image, { type ImageProps } from "next/image";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { urlFor } from "@/lib/sanity/image";

interface SanityImageProps extends Omit<ImageProps, "src" | "alt"> {
  image: SanityImageSource & {
    alt?: string;
    asset?: {
      metadata?: {
        lqip?: string; // Low-quality image placeholder from Sanity
        dimensions?: {
          width: number;
          height: number;
          aspectRatio: number;
        };
      };
    };
  };
  alt: string;
  maxWidth?: number;
}

export function SanityImage({
  image,
  alt,
  maxWidth = 1200,
  ...props
}: SanityImageProps) {
  const imageUrl = urlFor(image)
    .width(maxWidth)
    .auto("format")
    .quality(75)
    .url();

  const lqip = image.asset?.metadata?.lqip;
  const dimensions = image.asset?.metadata?.dimensions;

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={dimensions?.width ?? maxWidth}
      height={
        dimensions?.height ??
        Math.round(maxWidth / (dimensions?.aspectRatio ?? 16 / 9))
      }
      // Use LQIP from Sanity for blur placeholder (prevents CLS)
      placeholder={lqip ? "blur" : "empty"}
      blurDataURL={lqip}
      // Responsive sizes to avoid oversized downloads
      sizes={props.sizes ?? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
      {...props}
    />
  );
}
```

### GROQ Query for Image Metadata

```groq
// Always fetch LQIP and dimensions with images
*[_type == "recipe" && slug.current == $slug][0] {
  title,
  slug,
  "mainImage": mainImage {
    ...,
    asset-> {
      _id,
      url,
      metadata {
        lqip,
        dimensions {
          width,
          height,
          aspectRatio
        }
      }
    }
  },
  // Gallery images with metadata
  "gallery": gallery[] {
    ...,
    asset-> {
      _id,
      url,
      metadata {
        lqip,
        dimensions
      }
    }
  }
}
```

### Hero Image (LCP Priority)

```tsx
// For the hero/above-the-fold image, set priority to preload it
<SanityImage
  image={recipe.mainImage}
  alt={recipe.title}
  maxWidth={1920}
  priority // Preloads this image - critical for LCP
  sizes="100vw"
  className="w-full h-[60vh] object-cover"
/>
```

### Image Configuration Tips

- **LQIP (Low Quality Image Placeholder)**: Always fetch `metadata.lqip` in GROQ queries.
  Sanity generates these automatically. Pass as `blurDataURL` to next/image.
- **Hotspot/Crop**: Sanity's `urlFor` respects hotspot and crop metadata set in the Studio.
- **Format Negotiation**: `auto('format')` serves AVIF to supported browsers, falling back
  to WebP, then JPEG. This can reduce file sizes by 30-50%.
- **Quality**: Use 60-75 for hero images, 50-65 for thumbnails. Food photography needs
  higher quality than UI elements.
- **Vercel Image Optimization Costs**: If using Sanity CDN's own optimization via a custom
  loader, Vercel's Image Optimization API is bypassed, saving on Vercel image optimization
  quotas. Alternatively, keep `remotePatterns` configured and let Vercel optimize.

---

## 5. Core Web Vitals Optimization

### Target Metrics

| Metric | Good | Needs Improvement | Poor | Rick's Cafe Target |
|---|---|---|---|---|
| **LCP** | <= 2.5s | <= 4.0s | > 4.0s | <= 2.0s |
| **INP** | <= 200ms | <= 500ms | > 500ms | <= 150ms |
| **CLS** | < 0.1 | < 0.25 | >= 0.25 | < 0.05 |

### LCP (Largest Contentful Paint) Optimization

LCP for a food blog is almost always the hero image. Strategies:

```tsx
// 1. Priority loading for hero images
<Image src={heroUrl} priority fetchPriority="high" ... />

// 2. Preload critical images via metadata
// src/app/recipes/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await sanityFetch<Recipe>({
    query: recipeBySlugQuery,
    params: { slug },
    tags: ["recipe", `recipe:${slug}`],
  });

  const ogImage = urlFor(recipe.mainImage).width(1200).height(630).url();

  return {
    title: recipe.title,
    description: recipe.description,
    openGraph: { images: [ogImage] },
  };
}
```

```tsx
// 3. Inline critical CSS for above-the-fold content
// Server Components render on the server, so their styles are already in the HTML.
// Avoid client-side CSS-in-JS for above-the-fold elements.

// 4. Avoid layout-blocking resources
// next/font self-hosts fonts with font-display: swap by default
// next/image uses native lazy loading for off-screen images
```

### CLS (Cumulative Layout Shift) Prevention

```tsx
// 1. Always provide width/height or aspect-ratio for images
<div className="aspect-video relative overflow-hidden">
  <SanityImage image={recipe.mainImage} alt={recipe.title} fill sizes="100vw" />
</div>

// 2. Reserve space for dynamic content
<div className="min-h-[200px]">
  <Suspense fallback={<RecipeCardSkeleton />}>
    <RelatedRecipes slug={slug} />
  </Suspense>
</div>

// 3. Avoid injecting content above existing content
// BAD: Banner that pushes content down after hydration
// GOOD: Banner with reserved space or overlay positioning

// 4. Use CSS contain for animation containers
<div className="contain-layout contain-paint">
  <AnimatedHero />
</div>
```

### INP (Interaction to Next Paint) Optimization

```tsx
// 1. Debounce expensive interactions
import { useDeferredValue, useTransition } from "react";

function RecipeSearch() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setQuery(value); // Immediate update for input
    startTransition(() => {
      // Deferred update for expensive filtering
      filterRecipes(value);
    });
  };

  return (
    <div>
      <input value={query} onChange={(e) => handleSearch(e.target.value)} />
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        <RecipeResults query={deferredQuery} />
      </div>
    </div>
  );
}

// 2. Use requestAnimationFrame for scroll-based animations
useEffect(() => {
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateParallax(window.scrollY);
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, []);

// 3. Keep event handlers lean - offload work to Web Workers if heavy
```

---

## 6. Bundle Size Analysis & Tree-Shaking

### Setup Bundle Analyzer

```bash
npm install @next/bundle-analyzer --save-dev
```

```typescript
// next.config.ts
import withBundleAnalyzer from "@next/bundle-analyzer";

const config: NextConfig = {
  // ... your config
};

export default process.env.ANALYZE === "true"
  ? withBundleAnalyzer({ enabled: true })(config)
  : config;
```

```bash
# Run analysis
ANALYZE=true npm run build
# Opens three tabs: client.html, edge.html, nodejs.html
```

### Framer Motion: Reduce from 34kb to ~5kb

Framer Motion's `motion` component cannot be tree-shaken below ~34kb. Use `LazyMotion`
with the `m` component instead.

```tsx
// src/components/providers/motion-provider.tsx
"use client";

import { LazyMotion } from "framer-motion";

// Only load the features you actually use
const loadFeatures = () =>
  import("@/lib/motion-features").then((mod) => mod.default);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
```

```typescript
// src/lib/motion-features.ts
import { domAnimation } from "framer-motion";

// domAnimation (~5kb) includes: animate, exit, variants, tap, hover, pan, inView
// domMax (~18kb) adds: drag, layout animations
// Choose domAnimation unless you need drag or layout
export default domAnimation;
```

```tsx
// src/components/ui/animated-card.tsx
"use client";

import { m } from "framer-motion"; // NOT 'motion' - use 'm' with LazyMotion

export function AnimatedCard({ children }: { children: React.ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </m.div>
  );
}
```

### GSAP: Import Only What You Need

```typescript
// GOOD: Import only core + specific plugins
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// BAD: Never import the entire package
// import "gsap/all";
```

GSAP core is ~23kb gzipped. Each plugin adds 5-15kb. Common plugins:

| Plugin | Size (gzip) | Use Case |
|---|---|---|
| ScrollTrigger | ~12kb | Scroll-based animations |
| ScrollSmoother | ~8kb | Smooth scrolling (Club) |
| SplitText | ~6kb | Text splitting animations (Club) |
| Flip | ~7kb | Layout transitions |
| DrawSVG | ~4kb | SVG path animations (Club) |

### Dynamic Imports for Animation Libraries

```tsx
// src/components/sections/recipe-hero.tsx
"use client";

import dynamic from "next/dynamic";

// Only load GSAP-heavy hero animation on client side
const AnimatedHero = dynamic(
  () => import("@/components/animations/hero-animation"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[80vh] bg-gradient-to-b from-amber-900 to-stone-900" />
    ),
  }
);

export function RecipeHero({ recipe }: { recipe: Recipe }) {
  return <AnimatedHero recipe={recipe} />;
}
```

### Package Import Optimization

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    // Automatically optimize barrel exports
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "@sanity/icons",
      "@sanity/ui",
      "date-fns",
    ],
  },
};
```

### Bundle Budget Targets

| Chunk | Target | Notes |
|---|---|---|
| First Load JS (shared) | < 85kb | Framework + shared libs |
| Per-page JS | < 50kb | Page-specific code |
| Animation libraries | < 40kb | GSAP core + ScrollTrigger + Framer domAnimation |
| Total First Load | < 130kb | All critical JS |

---

## 7. Caching Headers & CDN Configuration

### Vercel CDN Cache Behavior

Vercel automatically handles caching for Next.js. Key behaviors:

- **Static pages**: Served from edge, `Cache-Control: public, max-age=31536000, immutable`
- **ISR pages**: `s-maxage=<revalidate>, stale-while-revalidate`
- **Dynamic pages**: `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`
- **Static assets** (`_next/static/`): Immutable, content-addressed

### Custom Cache Headers

```typescript
// next.config.ts - headers()
async headers() {
  return [
    // API routes that should be cached at edge
    {
      source: "/api/recipes/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "s-maxage=600, stale-while-revalidate=30",
        },
      ],
    },
    // Font files - cache forever (content-addressed)
    {
      source: "/fonts/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    // Sanity images proxied through our domain
    {
      source: "/images/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        },
      ],
    },
  ];
},
```

### Cache Control Directive Reference

| Directive | Meaning | Use Case |
|---|---|---|
| `s-maxage=N` | CDN cache TTL (seconds) | ISR pages, API routes |
| `max-age=N` | Browser cache TTL | Static assets |
| `stale-while-revalidate=N` | Serve stale while refreshing | Background refresh |
| `immutable` | Never revalidate | Hashed static files |
| `public` | Cacheable by CDN | Most GET responses |
| `private` | Browser only, no CDN | Personalized content |
| `no-store` | Never cache | Auth tokens, PII |

### Data Cache (Vercel-Specific)

When deploying to Vercel, the Next.js Data Cache is automatically backed by durable
storage, shared across all serverless functions in a region. This is what makes ISR and
`revalidateTag`/`revalidatePath` work reliably across function invocations.

```typescript
// Explicit cache control in fetch
const data = await fetch("https://api.example.com/data", {
  next: {
    revalidate: 3600, // Cache for 1 hour
    tags: ["external-data"],
  },
});

// Force fresh data
const freshData = await fetch("https://api.example.com/data", {
  cache: "no-store",
});
```

---

## 8. Preview Deployment Workflow for Content Editors

### Architecture Overview

1. Content editor makes changes in Sanity Studio
2. Sanity Presentation tool embeds the Next.js app in an iframe
3. Next.js Draft Mode serves uncached, live-updating content
4. Visual Editing overlays allow clicking on content to edit it

### Enable Draft Mode API Route

```typescript
// src/app/api/draft-mode/enable/route.ts
import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/lib/sanity/client";

// This endpoint is called by Sanity's Presentation tool
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({
    token: process.env.SANITY_API_READ_TOKEN,
  }),
});
```

```typescript
// src/app/api/draft-mode/disable/route.ts
import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  (await draftMode()).disable();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL));
}
```

### Root Layout with Visual Editing

```tsx
// src/app/layout.tsx
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEnabled: isDraftMode } = await draftMode();

  return (
    <html lang="en">
      <body>
        {children}
        {/* Only render VisualEditing in draft mode */}
        {isDraftMode && (
          <VisualEditing />
        )}
      </body>
    </html>
  );
}
```

### Live Content in Components

```tsx
// src/app/recipes/[slug]/page.tsx
import { draftMode } from "next/headers";
import { sanityFetch } from "@/lib/sanity/fetch";

export default async function RecipePage({ params }: Props) {
  const { slug } = await params;
  const { isEnabled: isDraftMode } = await draftMode();

  const recipe = await sanityFetch<Recipe>({
    query: recipeBySlugQuery,
    params: { slug },
    tags: ["recipe", `recipe:${slug}`],
    // In draft mode, bypass cache for fresh content
    revalidate: isDraftMode ? 0 : false,
  });

  return <RecipeDetail recipe={recipe} />;
}
```

### Sanity Studio Configuration for Presentation

```typescript
// sanity.config.ts (in Sanity Studio)
import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";

export default defineConfig({
  // ...
  plugins: [
    presentationTool({
      previewUrl: {
        // Use Vercel preview deployment URL or localhost
        origin:
          process.env.SANITY_STUDIO_PREVIEW_URL ||
          "http://localhost:3000",
        draftMode: {
          enable: "/api/draft-mode/enable",
        },
      },
    }),
  ],
});
```

### Vercel Preview Deployment Protection

- Enable **Deployment Protection** in Vercel project settings for Preview environments
- Use **Password Protection** for preview URLs so only editors can access them
- Set `SANITY_STUDIO_PREVIEW_URL` to the Vercel preview deployment URL pattern
- Vercel automatically generates preview URLs for each branch/PR

### Content Editor Workflow

1. Editor opens Sanity Studio and navigates to a document
2. Clicks "Open Preview" which opens the Presentation tool
3. The app loads in draft mode, showing unpublished changes
4. Visual Editing overlays highlight editable elements
5. Editor clicks elements to edit them inline
6. Changes appear in real-time via Live Content API
7. When satisfied, editor publishes the document
8. Sanity webhook triggers on-demand revalidation of the production site

---

## 9. Performance Monitoring & Analytics

### Vercel Speed Insights

```bash
npm install @vercel/speed-insights
```

```tsx
// src/app/layout.tsx
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

Speed Insights tracks all Core Web Vitals (LCP, CLS, INP, FCP, TTFB) with real user
data from actual visitors, broken down by route, device type, and connection speed.

### Vercel Web Analytics

```bash
npm install @vercel/analytics
```

```tsx
// src/app/layout.tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

Web Analytics provides page views, unique visitors, referrers, geolocation, device/browser
breakdowns, and top pages without compromising user privacy (no cookies required).

### Custom Performance Reporting

```typescript
// src/lib/performance.ts
"use client";

import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from "web-vitals";

function sendToAnalytics(metric: Metric) {
  // Send to your analytics endpoint
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating, // "good" | "needs-improvement" | "poor"
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: window.location.href,
  });

  // Use sendBeacon for reliability (fires even during page unload)
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/vitals", body);
  } else {
    fetch("/api/analytics/vitals", {
      body,
      method: "POST",
      keepalive: true,
    });
  }
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

### Monitoring Dashboard Checklist

Enable these in Vercel dashboard:

- [ ] **Speed Insights** - Real User Monitoring for Core Web Vitals
- [ ] **Web Analytics** - Page views, visitors, referrers
- [ ] **Logs** - Runtime logs from serverless functions
- [ ] **Usage** - Function invocations, bandwidth, image optimizations
- [ ] **Deployment Protection** - Password-protect preview deployments

### Alerts

Configure alerts in Vercel for:

- Build failures
- Function errors (500 responses)
- Performance regressions (LCP > 3s, CLS > 0.15)
- Usage approaching plan limits

---

## 10. Edge Middleware Use Cases

### Middleware File Location

```
src/
  middleware.ts    <-- Must be at the project root or src/ root
```

### Geolocation-Based Content

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Pass geolocation data to server components via headers
  const country = request.geo?.country || "US";
  const city = request.geo?.city || "Unknown";
  response.headers.set("x-user-country", country);
  response.headers.set("x-user-city", city);

  return response;
}

export const config = {
  // Only run middleware on specific paths (improves performance)
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
```

### A/B Testing for Recipes Layout

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Check if user already has a variant assigned
  const variant = request.cookies.get("recipe-layout-variant")?.value;

  if (!variant && request.nextUrl.pathname.startsWith("/recipes")) {
    const response = NextResponse.next();
    // Assign 50/50 split
    const newVariant = Math.random() < 0.5 ? "grid" : "masonry";
    response.cookies.set("recipe-layout-variant", newVariant, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: "lax",
    });
    response.headers.set("x-recipe-layout", newVariant);
    return response;
  }

  const response = NextResponse.next();
  if (variant) {
    response.headers.set("x-recipe-layout", variant);
  }
  return response;
}
```

### Bot Detection and SEO

```typescript
// Serve pre-rendered content to search engine bots
const BOTS = /Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider/i;

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const isBot = BOTS.test(userAgent);

  const response = NextResponse.next();
  response.headers.set("x-is-bot", isBot ? "true" : "false");

  // Skip animations for bots to improve crawl performance
  if (isBot) {
    response.headers.set("x-reduce-motion", "true");
  }

  return response;
}
```

### Middleware Performance Rules

- **Keep middleware lean**: It runs on every matched request at the edge
- **Use `matcher` config**: Do not run middleware on static assets
- **Avoid heavy computation**: No database queries, no large data processing
- **No Node.js APIs**: Edge runtime does not support full Node.js
- **Edge runtime is default**: Runs in all regions for lowest latency

---

## 11. Loading Strategies

### Server Components (Default - No Client JS)

```tsx
// src/app/recipes/page.tsx
// Server Component by default - zero client JS
import { sanityFetch } from "@/lib/sanity/fetch";

export default async function RecipesPage() {
  const recipes = await sanityFetch<Recipe[]>({
    query: allRecipesQuery,
    tags: ["recipe"],
  });

  return (
    <main>
      <h1>Our Recipes</h1>
      <RecipeGrid recipes={recipes} />
    </main>
  );
}
```

### Streaming with Suspense

```tsx
// src/app/recipes/[slug]/page.tsx
import { Suspense } from "react";

export default async function RecipePage({ params }: Props) {
  const { slug } = await params;

  return (
    <main>
      {/* Hero loads immediately */}
      <RecipeHero slug={slug} />

      {/* Related recipes stream in after */}
      <Suspense fallback={<RecipeGridSkeleton count={6} />}>
        <RelatedRecipes slug={slug} />
      </Suspense>

      {/* Comments stream in last */}
      <Suspense fallback={<CommentsSkeleton />}>
        <RecipeComments slug={slug} />
      </Suspense>
    </main>
  );
}
```

### Dynamic Imports for Client Components

```tsx
// src/components/sections/recipe-gallery.tsx
"use client";

import dynamic from "next/dynamic";

// Heavy lightbox component loaded only when gallery is in viewport
const Lightbox = dynamic(() => import("@/components/ui/lightbox"), {
  ssr: false,
  loading: () => null, // No loading indicator - just show grid
});

// GSAP-powered scroll animation loaded on client only
const ScrollAnimations = dynamic(
  () => import("@/components/animations/scroll-animations"),
  { ssr: false }
);

export function RecipeGallery({ images }: { images: SanityImage[] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <>
      <ScrollAnimations />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, i) => (
          <button key={img._key} onClick={() => {
            setSelectedIndex(i);
            setLightboxOpen(true);
          }}>
            <SanityImage image={img} alt={img.alt || ""} />
          </button>
        ))}
      </div>
      {lightboxOpen && (
        <Lightbox
          images={images}
          index={selectedIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
```

### Route-Level Code Splitting

Next.js App Router automatically code-splits at the route level. Each `page.tsx` and
`layout.tsx` becomes its own chunk. Shared components in layouts are loaded once and
persist across navigations.

### Intersection Observer for Lazy Sections

```tsx
// src/hooks/use-in-view.ts
"use client";

import { useEffect, useRef, useState } from "react";

export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el); // Only trigger once
        }
      },
      { rootMargin: "200px", ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isInView };
}
```

```tsx
// src/components/sections/lazy-section.tsx
"use client";

import { useInView } from "@/hooks/use-in-view";
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(
  () => import("@/components/sections/heavy-component"),
  { ssr: false }
);

export function LazySection() {
  const { ref, isInView } = useInView();

  return (
    <div ref={ref} className="min-h-[400px]">
      {isInView ? <HeavyComponent /> : <SectionSkeleton />}
    </div>
  );
}
```

---

## 12. Font Optimization

### Self-Hosted Google Fonts with next/font

```typescript
// src/app/fonts.ts
import { Playfair_Display, Inter } from "next/font/google";
import localFont from "next/font/local";

// Display font for headings (variable weight)
export const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  // Only load the weights you use
  weight: ["400", "500", "600", "700"],
});

// Body font (variable font - single file, all weights)
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Custom/local font example
export const customScript = localFont({
  src: [
    {
      path: "../../public/fonts/custom-script-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/custom-script-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-script",
});
```

```tsx
// src/app/layout.tsx
import { playfair, inter, customScript } from "./fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${customScript.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-sans: var(--font-inter);
    --font-display: var(--font-playfair);
    --font-script: var(--font-script);
  }
}
```

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
        script: ["var(--font-script)", "cursive"],
      },
    },
  },
};
```

### Font Optimization Rules

- **Always use `display: "swap"`**: Prevents invisible text during font loading
- **Use variable fonts**: One file covers all weights, reducing HTTP requests
- **Subset aggressively**: Only `latin` unless you need other character sets
- **Preload critical fonts**: next/font does this automatically
- **Self-hosted via next/font**: Zero external requests, no FOIT, no CLS
- **Limit font families**: 2-3 maximum. Each family adds ~20-80kb
- **WOFF2 only**: Best compression, supported by all modern browsers

---

## 13. Animation Performance Pitfalls

### Common Pitfalls and Solutions

#### Pitfall 1: Animating Layout Properties

```tsx
// BAD: Animates width/height, causes layout recalculation + CLS
<m.div animate={{ width: "100%", height: 300 }} />

// GOOD: Use transform for size changes
<m.div
  animate={{ scaleX: 1, scaleY: 1 }}
  style={{ transformOrigin: "top left" }}
/>

// GOOD: Or use clip-path for reveal animations
<m.div animate={{ clipPath: "inset(0 0 0 0)" }} />
```

#### Pitfall 2: GSAP ScrollTrigger Memory Leaks

```tsx
// BAD: No cleanup
useEffect(() => {
  gsap.to(".box", {
    scrollTrigger: { trigger: ".box", start: "top center" },
    x: 200,
  });
}, []);

// GOOD: Proper cleanup with GSAP context
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.to(".box", {
      scrollTrigger: { trigger: ".box", start: "top center" },
      x: 200,
    });
  }, containerRef); // Scope to container

  return () => ctx.revert(); // Kills all animations + ScrollTriggers
}, []);
```

#### Pitfall 3: Animating During Page Load (Hurts LCP)

```tsx
// BAD: Complex entrance animation blocks LCP
<m.div
  initial={{ opacity: 0, y: 100, rotate: 45, scale: 0.5 }}
  animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
  transition={{ duration: 1.5, ease: "easeOut" }}
>
  <Image src={heroImage} priority />
</m.div>

// GOOD: Minimal entrance, let LCP image paint first
<m.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3, delay: 0.1 }}
>
  <Image src={heroImage} priority />
</m.div>
```

#### Pitfall 4: Too Many Simultaneous Animations

```tsx
// BAD: 50 cards animating at once on page load
{recipes.map((recipe, i) => (
  <m.div
    key={recipe._id}
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.1 }} // 5 seconds of staggered animation!
  />
))}

// GOOD: Only animate visible items, limit stagger
{recipes.map((recipe, i) => (
  <m.div
    key={recipe._id}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay: Math.min(i * 0.05, 0.3) }} // Cap total stagger at 0.3s
  />
))}
```

#### Pitfall 5: Not Using GPU-Accelerated Properties

Only these properties are composited (GPU-accelerated, no layout/paint):

| Property | GPU-Accelerated | Notes |
|---|---|---|
| `transform` | Yes | translate, scale, rotate |
| `opacity` | Yes | Fade in/out |
| `filter` | Yes | blur, brightness, etc. |
| `clip-path` | Mostly | Reveals, masks |
| `width` / `height` | No | Triggers layout |
| `top` / `left` | No | Triggers layout |
| `margin` / `padding` | No | Triggers layout |
| `background-color` | No | Triggers paint |
| `border` | No | Triggers paint + layout |

```tsx
// Force GPU layer promotion for smoother animations
<m.div
  style={{ willChange: "transform, opacity" }}
  animate={{ x: 100, opacity: 0.5 }}
/>

// IMPORTANT: Remove will-change after animation completes
// to free GPU memory. Or use CSS:
// .animating { will-change: transform; }
// .done { will-change: auto; }
```

#### Pitfall 6: Framer Motion + GSAP Conflict

```tsx
// BAD: Both libraries fighting over the same element
<m.div animate={{ x: 100 }} ref={gsapRef} />

// GOOD: Separate concerns - use one library per element
// Use Framer Motion for React-lifecycle animations (mount/unmount, hover, tap)
// Use GSAP for scroll-driven animations (ScrollTrigger, timeline sequences)

// If you must use both, let GSAP handle a wrapper:
<div ref={gsapRef}> {/* GSAP controls this */}
  <m.div whileHover={{ scale: 1.05 }}> {/* Framer controls this */}
    Content
  </m.div>
</div>
```

#### Pitfall 7: Not Respecting Reduced Motion

```tsx
// src/hooks/use-reduced-motion.ts
"use client";

import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}
```

```tsx
// Usage in components
function AnimatedSection({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion();

  return (
    <m.div
      initial={{ opacity: 0, y: prefersReduced ? 0 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0.01 : 0.5 }}
      viewport={{ once: true }}
    >
      {children}
    </m.div>
  );
}
```

```css
/* Global CSS fallback */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 14. Performance Budgets

### Recommended Budgets for Rick's Cafe

```jsonc
// Custom performance budget configuration
// Enforce via CI/CD or @next/bundle-analyzer
{
  "budgets": {
    "javascript": {
      "firstLoad": "130kb",      // Total JS for first page load
      "perRoute": "50kb",        // Additional JS per route
      "thirdParty": "40kb"       // Animation libs, analytics
    },
    "images": {
      "heroImage": "200kb",      // LCP image (after optimization)
      "thumbnail": "30kb",       // Recipe card images
      "totalAboveFold": "400kb"  // All images above the fold
    },
    "fonts": {
      "total": "150kb",          // All font files combined
      "perFamily": "80kb"        // Single font family (all weights)
    },
    "css": {
      "total": "50kb",           // All CSS
      "critical": "15kb"         // Inlined critical CSS
    },
    "webVitals": {
      "lcp": "2000",             // ms
      "cls": "0.05",
      "inp": "150",              // ms
      "fcp": "1200",             // ms
      "ttfb": "600"              // ms
    }
  }
}
```

### Enforcing Budgets in CI

```typescript
// scripts/check-bundle-size.ts
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const BUDGET_KB = 130;
const BUILD_DIR = ".next/static/chunks";

function getDirectorySize(dir: string): number {
  let size = 0;
  for (const file of readdirSync(dir)) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isFile() && file.endsWith(".js")) {
      size += stat.size;
    } else if (stat.isDirectory()) {
      size += getDirectorySize(filePath);
    }
  }
  return size;
}

const totalSizeKB = getDirectorySize(BUILD_DIR) / 1024;
console.log(`Total JS bundle: ${totalSizeKB.toFixed(1)} KB`);

if (totalSizeKB > BUDGET_KB) {
  console.error(`BUDGET EXCEEDED: ${totalSizeKB.toFixed(1)} KB > ${BUDGET_KB} KB`);
  process.exit(1);
}
```

### Lighthouse CI Configuration

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci && npm run build
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v12
        with:
          urls: |
            http://localhost:3000/
            http://localhost:3000/recipes
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

```jsonc
// lighthouse-budget.json
[
  {
    "path": "/*",
    "timings": [
      { "metric": "interactive", "budget": 3500 },
      { "metric": "first-contentful-paint", "budget": 1500 },
      { "metric": "largest-contentful-paint", "budget": 2500 }
    ],
    "resourceSizes": [
      { "resourceType": "script", "budget": 150 },
      { "resourceType": "image", "budget": 400 },
      { "resourceType": "font", "budget": 150 },
      { "resourceType": "stylesheet", "budget": 50 },
      { "resourceType": "total", "budget": 800 }
    ]
  }
]
```

---

## Quick Reference: Deployment Checklist

### Before First Deploy

- [ ] Set all environment variables in Vercel dashboard (Production + Preview)
- [ ] Configure Sanity webhook pointing to `/api/revalidate`
- [ ] Test revalidation locally with `next dev --experimental-https`
- [ ] Set up `remotePatterns` for Sanity CDN images
- [ ] Install `@vercel/speed-insights` and `@vercel/analytics`
- [ ] Run `ANALYZE=true npm run build` and verify bundle sizes
- [ ] Test Core Web Vitals with Lighthouse (target: all green)
- [ ] Verify fonts load with no CLS (check with Chrome DevTools)
- [ ] Test draft mode / visual editing with Sanity Presentation tool

### Before Each Release

- [ ] Run bundle analyzer - check for regressions
- [ ] Verify no `"use client"` on components that do not need it
- [ ] Check that hero images use `priority` prop
- [ ] Verify ISR tags match webhook revalidation logic
- [ ] Test on slow 3G (Chrome DevTools throttling)
- [ ] Run Lighthouse CI in PR checks

### Monitoring (Ongoing)

- [ ] Review Vercel Speed Insights weekly
- [ ] Check for CLS regressions after content changes
- [ ] Monitor serverless function execution times
- [ ] Watch image optimization usage against plan limits
- [ ] Review error logs for revalidation failures

---

## Sources & References

- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Deploying a Scalable Next.js App on Vercel](https://blogs.perficient.com/2025/06/02/deploying-a-scalable-next-js-app-on-vercel-a-step-by-step-guide/)
- [Next.js ISR Guide](https://nextjs.org/docs/app/guides/incremental-static-regeneration)
- [Sanity Webhooks and On-demand Revalidation in Next.js](https://victoreke.com/blog/sanity-webhooks-and-on-demand-revalidation-in-nextjs)
- [Path-based Revalidation - Sanity Learn](https://www.sanity.io/learn/course/controlling-cached-content-in-next-js/path-based-revalidation)
- [Sanity: On-demand Revalidation with Next.js](https://www.sanity.io/answers/using-on-demand-revalidation-with-next-js-and-sanity--how-to-revalidate-all-paths-when-a-specific-schema-type-changes-)
- [Optimizing Core Web Vitals - Vercel](https://vercel.com/kb/guide/optimizing-core-web-vitals-in-2024)
- [How to Optimize Core Web Vitals in Next.js App Router for 2025](https://makersden.io/blog/optimize-web-vitals-in-nextjs-2025)
- [How to Use Motion Design Without Hurting Page Speed](https://thriveagency.com/news/how-to-use-motion-design-without-hurting-page-speed/)
- [Image Optimization with Next.js and Sanity.io](https://medium.com/@drazen.bebic/image-optimization-with-next-js-and-sanity-io-6956b9ceae4f)
- [Sanity Image Transformations](https://www.sanity.io/docs/apis-and-sdks/image-urls)
- [Sanity: Presenting Images](https://www.sanity.io/docs/presenting-images)
- [Vercel Edge Middleware](https://vercel.com/blog/vercel-edge-middleware-dynamic-at-the-speed-of-static)
- [Next.js Middleware & Edge Functions Patterns](https://medium.com/@mernstackdevbykevin/next-js-16-middleware-edge-functions-latest-patterns-in-2025-8ab2653bc9de)
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Complete Guide to Deploying Next.js on Vercel](https://eastondev.com/blog/en/posts/dev/20251220-nextjs-vercel-deploy-guide/)
- [Framer Motion: Reduce Bundle Size](https://motion.dev/docs/react-reduce-bundle-size)
- [GSAP Tree Shaking](https://gsap.com/community/forums/topic/28599-gsap-imports-tree-shaking-reduce-bundle-size/)
- [Next.js Package Bundling Guide](https://nextjs.org/docs/app/guides/package-bundling)
- [Vercel Cache-Control Headers](https://vercel.com/docs/headers/cache-control-headers)
- [Vercel CDN Cache](https://vercel.com/docs/cdn-cache)
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts)
- [Visual Editing with Next.js App Router - Sanity](https://www.sanity.io/docs/visual-editing/visual-editing-with-next-js-app-router)
- [Next.js Lazy Loading Guide](https://nextjs.org/docs/pages/guides/lazy-loading)
- [Vercel Project Configuration (vercel.json)](https://vercel.com/docs/project-configuration)
- [@next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
