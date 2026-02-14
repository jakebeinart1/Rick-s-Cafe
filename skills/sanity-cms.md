# Sanity CMS Integration -- Rick's Cafe Food Blog

> Comprehensive reference for Sanity.io v3 with Next.js App Router.
> Covers project setup, schema design, GROQ queries, image handling,
> Portable Text rendering, Studio customization, and preview/draft mode.
>
> Sources:
> - [Sanity Docs Home](https://www.sanity.io/docs)
> - [Opinionated Studio Guide](https://www.sanity.io/docs/developer-guides/an-opinionated-guide-to-sanity-studio)
> - [High Performance GROQ](https://www.sanity.io/docs/developer-guides/high-performance-groq)
> - [GROQ Cheat Sheet](https://www.sanity.io/docs/content-lake/query-cheat-sheet)
> - [next-sanity GitHub](https://github.com/sanity-io/next-sanity)
> - [Image Transformations](https://www.sanity.io/docs/apis-and-sdks/image-urls)
> - [Portable Text to React](https://www.sanity.io/docs/portable-text-to-react)
> - [Visual Editing App Router](https://www.sanity.io/docs/visual-editing/visual-editing-with-next-js-app-router)
> - [Structure Builder](https://www.sanity.io/docs/studio/structure-introduction)
> - [Sanity Pricing](https://www.sanity.io/pricing)

---

## Table of Contents

1. [Project Setup and Configuration](#1-project-setup-and-configuration)
2. [Schema Design -- Restaurant](#2-schema-design--restaurant)
3. [Schema Design -- Site Settings](#3-schema-design--site-settings)
4. [Schema Index and Registration](#4-schema-index-and-registration)
5. [GROQ Query Patterns](#5-groq-query-patterns)
6. [Sanity Client Setup for Next.js App Router](#6-sanity-client-setup-for-nextjs-app-router)
7. [Image Handling with @sanity/image-url](#7-image-handling-with-sanityimage-url)
8. [Portable Text and Markdown Rendering](#8-portable-text-and-markdown-rendering)
9. [Studio Customization](#9-studio-customization)
10. [Preview / Draft Mode Setup](#10-preview--draft-mode-setup)
11. [Pricing and Free Tier Limitations](#11-pricing-and-free-tier-limitations)
12. [Common Pitfalls and Solutions](#12-common-pitfalls-and-solutions)
13. [Environment Variables Reference](#13-environment-variables-reference)

---

## 1. Project Setup and Configuration

### Initialize a new Sanity project

```bash
# Create Sanity Studio (use --typescript and --template clean)
npm create sanity@latest -- --typescript --template clean

# Or add Sanity to an existing Next.js project
npx sanity@latest init --env
```

### Install dependencies for the Next.js frontend

```bash
npm install next-sanity @sanity/image-url @portabletext/react
```

`next-sanity` re-exports `createClient`, `defineQuery`, and everything you need
from `@sanity/client` -- you do NOT need to install `@sanity/client` separately.

### Recommended directory structure

```
rick-cafe/
├── sanity/                      # Sanity Studio (can be embedded or separate)
│   ├── sanity.config.ts
│   ├── sanity.cli.ts
│   └── src/
│       ├── schemaTypes/
│       │   ├── index.ts         # schema registry
│       │   ├── restaurantType.ts
│       │   └── siteSettingsType.ts
│       ├── structure/
│       │   └── index.ts         # Structure Builder config
│       └── plugins/
├── src/                         # Next.js App Router
│   ├── app/
│   │   ├── (blog)/
│   │   │   ├── page.tsx
│   │   │   └── restaurants/
│   │   │       └── [slug]/
│   │   │           └── page.tsx
│   │   └── studio/[[...tool]]/
│   │       └── page.tsx         # embedded Studio route
│   ├── sanity/
│   │   ├── client.ts
│   │   ├── fetch.ts
│   │   ├── image.ts
│   │   └── queries.ts
│   └── components/
│       ├── PortableTextRenderer.tsx
│       └── SanityImage.tsx
├── .env.local
└── package.json
```

### sanity.config.ts (minimal)

```typescript
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './src/schemaTypes'
import { structure } from './src/structure'

export default defineConfig({
  name: 'ricks-cafe',
  title: "Rick's Cafe",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: '2025-01-01' }),
  ],
  schema: {
    types: schemaTypes,
  },
})
```

---

## 2. Schema Design -- Restaurant

File: `sanity/src/schemaTypes/restaurantType.ts`

```typescript
import { defineField, defineType, defineArrayMember } from 'sanity'
import { UtensilsCrossedIcon } from 'lucide-react' // or use @sanity/icons

// ── Reusable sub-object: per-axis score (1-10) ──────────────────────
const scoreAxis = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'number',
    validation: (rule) => rule.required().min(1).max(10).precision(1),
    description: `Score from 1-10`,
  })

export const restaurantType = defineType({
  name: 'restaurant',
  title: 'Restaurant',
  type: 'document',
  icon: UtensilsCrossedIcon,

  // ── Field Groups ──────────────────────────────────────────────────
  groups: [
    { name: 'details', title: 'Details', default: true },
    { name: 'scoring', title: 'Scoring' },
    { name: 'review', title: 'Review' },
    { name: 'media', title: 'Media' },
  ],

  fields: [
    // ── Details Group ───────────────────────────────────────────────
    defineField({
      name: 'name',
      title: 'Restaurant Name',
      type: 'string',
      group: 'details',
      validation: (rule) => rule.required().max(120),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'details',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      group: 'details',
      description: 'City, neighborhood, or full address',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'cuisine',
      title: 'Cuisine',
      type: 'string',
      group: 'details',
      options: {
        list: [
          { title: 'Italian', value: 'italian' },
          { title: 'Japanese', value: 'japanese' },
          { title: 'Mexican', value: 'mexican' },
          { title: 'French', value: 'french' },
          { title: 'American', value: 'american' },
          { title: 'Chinese', value: 'chinese' },
          { title: 'Indian', value: 'indian' },
          { title: 'Thai', value: 'thai' },
          { title: 'Mediterranean', value: 'mediterranean' },
          { title: 'Korean', value: 'korean' },
          { title: 'Vietnamese', value: 'vietnamese' },
          { title: 'Seafood', value: 'seafood' },
          { title: 'BBQ / Smokehouse', value: 'bbq' },
          { title: 'Fusion', value: 'fusion' },
          { title: 'Other', value: 'other' },
        ],
        layout: 'dropdown',
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'priceRange',
      title: 'Price Range',
      type: 'string',
      group: 'details',
      options: {
        list: [
          { title: '$', value: '$' },
          { title: '$$', value: '$$' },
          { title: '$$$', value: '$$$' },
          { title: '$$$$', value: '$$$$' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'dateVisited',
      title: 'Date Visited',
      type: 'date',
      group: 'details',
      options: { dateFormat: 'YYYY-MM-DD' },
      validation: (rule) => rule.required(),
    }),

    // ── Scoring Group ───────────────────────────────────────────────
    defineField({
      name: 'ricksScore',
      title: "Rick's Score",
      type: 'number',
      group: 'scoring',
      description: 'Overall score from 1-10 (the headline number)',
      validation: (rule) => rule.required().min(1).max(10).precision(1),
    }),

    defineField({
      name: 'scores',
      title: '5-Axis Scores',
      type: 'object',
      group: 'scoring',
      description: 'Granular breakdown across five dimensions',
      fields: [
        scoreAxis('taste', 'Taste'),
        scoreAxis('vibe', 'Vibe'),
        scoreAxis('service', 'Service'),
        scoreAxis('value', 'Value'),
        scoreAxis('rickFactor', 'Rick Factor'),
      ],
      options: { columns: 5 },
    }),

    // ── Review Group ────────────────────────────────────────────────
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      group: 'review',
      rows: 3,
      description: 'Short blurb for cards and previews (max 280 chars)',
      validation: (rule) => rule.required().max(280),
    }),

    defineField({
      name: 'review',
      title: 'Full Review',
      type: 'array',
      group: 'review',
      description: 'Rich text review using Portable Text',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Underline', value: 'underline' },
              { title: 'Strikethrough', value: 'strike-through' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: (rule) =>
                      rule.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto'] }),
                  }),
                  defineField({
                    name: 'openInNewTab',
                    type: 'boolean',
                    title: 'Open in new tab',
                    initialValue: false,
                  }),
                ],
              },
            ],
          },
        }),
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              type: 'string',
              title: 'Alt text',
              description: 'Required for accessibility',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'caption',
              type: 'string',
              title: 'Caption',
            }),
          ],
        }),
      ],
    }),

    // ── Media Group ─────────────────────────────────────────────────
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'gallery',
      title: 'Image Gallery',
      type: 'array',
      group: 'media',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              type: 'string',
              title: 'Alt text',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'caption',
              type: 'string',
              title: 'Caption',
            }),
          ],
        }),
      ],
      options: { layout: 'grid' },
    }),
  ],

  // ── Preview ─────────────────────────────────────────────────────────
  preview: {
    select: {
      title: 'name',
      subtitle: 'location',
      score: 'ricksScore',
      media: 'mainImage',
    },
    prepare({ title, subtitle, score, media }) {
      return {
        title: `${title}`,
        subtitle: `${subtitle} -- Score: ${score ?? '?'}/10`,
        media,
      }
    },
  },

  // ── Orderings ───────────────────────────────────────────────────────
  orderings: [
    {
      title: 'Score (High to Low)',
      name: 'scoreDesc',
      by: [{ field: 'ricksScore', direction: 'desc' }],
    },
    {
      title: 'Date Visited (Newest)',
      name: 'dateDesc',
      by: [{ field: 'dateVisited', direction: 'desc' }],
    },
    {
      title: 'Name (A-Z)',
      name: 'nameAsc',
      by: [{ field: 'name', direction: 'asc' }],
    },
  ],
})
```

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| `cuisine` as string with options list | Easier than a reference doc for a small, known set. Adding new values is a one-line change. If cuisine list grows beyond ~30, switch to a separate `cuisine` document type and use references. |
| `priceRange` as string with `$`-`$$$$` | Avoids booleans; radio layout is fast for editors. |
| `scores` as embedded object | The 5-axis scores belong exclusively to this restaurant review -- no need for a separate document. Object with `columns: 5` renders them side-by-side in Studio. |
| `review` as Portable Text array | Gives structured rich text with inline images, headings, links. Far more flexible than raw markdown for querying and rendering. |
| `gallery` with `layout: 'grid'` | Renders thumbnails in Studio for quick visual scanning. |
| `slug` sourced from `name` | Auto-generates URL-friendly slugs from restaurant name. |
| Helper function `scoreAxis()` | DRY pattern for the five identical 1-10 number fields. |

---

## 3. Schema Design -- Site Settings

File: `sanity/src/schemaTypes/siteSettingsType.ts`

```typescript
import { defineField, defineType, defineArrayMember } from 'sanity'
import { CogIcon } from 'lucide-react'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,

  groups: [
    { name: 'general', title: 'General', default: true },
    { name: 'about', title: 'About / History' },
    { name: 'seo', title: 'SEO & Metadata' },
  ],

  fields: [
    // ── General ─────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Site Title',
      type: 'string',
      group: 'general',
      initialValue: "Rick's Cafe",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'general',
      description: 'Short tagline displayed in the header or hero area',
    }),

    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'general',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          initialValue: "Rick's Cafe logo",
        }),
      ],
    }),

    // ── About / History ─────────────────────────────────────────────
    defineField({
      name: 'aboutHeading',
      title: 'About Heading',
      type: 'string',
      group: 'about',
      initialValue: 'About Rick',
    }),

    defineField({
      name: 'aboutContent',
      title: 'About Content',
      type: 'array',
      group: 'about',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
        }),
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', type: 'string', title: 'Alt text' }),
            defineField({ name: 'caption', type: 'string', title: 'Caption' }),
          ],
        }),
      ],
    }),

    defineField({
      name: 'aboutImage',
      title: 'About Image',
      type: 'image',
      group: 'about',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          initialValue: 'About Rick',
        }),
      ],
    }),

    // ── SEO & Metadata ──────────────────────────────────────────────
    defineField({
      name: 'siteDescription',
      title: 'Site Description',
      type: 'text',
      group: 'seo',
      rows: 3,
      description: 'Used as default meta description (max 160 chars)',
      validation: (rule) => rule.max(160),
    }),

    defineField({
      name: 'ogImage',
      title: 'Default OG Image',
      type: 'image',
      group: 'seo',
      description: 'Default social sharing image (1200x630 recommended)',
    }),

    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      group: 'general',
      fields: [
        defineField({ name: 'instagram', type: 'url', title: 'Instagram' }),
        defineField({ name: 'twitter', type: 'url', title: 'Twitter / X' }),
        defineField({ name: 'tiktok', type: 'url', title: 'TikTok' }),
      ],
    }),
  ],

  preview: {
    prepare() {
      return {
        title: "Rick's Cafe -- Site Settings",
      }
    },
  },
})
```

### Singleton Pattern for Site Settings

Site settings should be a singleton (only one document of this type). Enforce
this in the Structure Builder (see Section 9).

---

## 4. Schema Index and Registration

File: `sanity/src/schemaTypes/index.ts`

```typescript
import { restaurantType } from './restaurantType'
import { siteSettingsType } from './siteSettingsType'

export const schemaTypes = [restaurantType, siteSettingsType]
```

---

## 5. GROQ Query Patterns

### Query file organization

File: `src/sanity/queries.ts`

```typescript
import { defineQuery } from 'next-sanity'

// ── All restaurants (list page) ─────────────────────────────────────
// Sorted by date visited (newest first), limited projection for cards
export const RESTAURANTS_QUERY = defineQuery(`
  *[_type == "restaurant"] | order(dateVisited desc) {
    _id,
    name,
    "slug": slug.current,
    location,
    cuisine,
    priceRange,
    ricksScore,
    summary,
    dateVisited,
    scores,
    mainImage {
      asset-> { _id, url },
      alt,
      crop,
      hotspot
    }
  }
`)

// ── Single restaurant by slug ───────────────────────────────────────
export const RESTAURANT_BY_SLUG_QUERY = defineQuery(`
  *[_type == "restaurant" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    location,
    cuisine,
    priceRange,
    ricksScore,
    summary,
    review,
    dateVisited,
    scores,
    mainImage {
      asset-> { _id, url },
      alt,
      crop,
      hotspot
    },
    gallery[] {
      asset-> { _id, url },
      alt,
      caption,
      crop,
      hotspot
    }
  }
`)

// ── Filter by cuisine ───────────────────────────────────────────────
export const RESTAURANTS_BY_CUISINE_QUERY = defineQuery(`
  *[_type == "restaurant" && cuisine == $cuisine] | order(ricksScore desc) {
    _id,
    name,
    "slug": slug.current,
    location,
    cuisine,
    priceRange,
    ricksScore,
    summary,
    dateVisited,
    mainImage {
      asset-> { _id, url },
      alt,
      crop,
      hotspot
    }
  }
`)

// ── Top rated (sorted by score, with optional minimum) ──────────────
export const TOP_RESTAURANTS_QUERY = defineQuery(`
  *[_type == "restaurant" && ricksScore >= $minScore] | order(ricksScore desc) [0...$limit] {
    _id,
    name,
    "slug": slug.current,
    location,
    cuisine,
    priceRange,
    ricksScore,
    summary,
    mainImage {
      asset-> { _id, url },
      alt,
      crop,
      hotspot
    }
  }
`)

// ── Filter by price range ───────────────────────────────────────────
export const RESTAURANTS_BY_PRICE_QUERY = defineQuery(`
  *[_type == "restaurant" && priceRange == $priceRange] | order(ricksScore desc) {
    _id,
    name,
    "slug": slug.current,
    location,
    cuisine,
    priceRange,
    ricksScore,
    summary,
    mainImage {
      asset-> { _id, url },
      alt,
      crop,
      hotspot
    }
  }
`)

// ── Search by name (text match) ─────────────────────────────────────
export const SEARCH_RESTAURANTS_QUERY = defineQuery(`
  *[_type == "restaurant" && name match $searchTerm + "*"] | order(ricksScore desc) {
    _id,
    name,
    "slug": slug.current,
    location,
    cuisine,
    priceRange,
    ricksScore,
    summary,
    mainImage {
      asset-> { _id, url },
      alt,
      crop,
      hotspot
    }
  }
`)

// ── Distinct cuisines (for filter dropdowns) ────────────────────────
export const CUISINES_QUERY = defineQuery(`
  array::unique(*[_type == "restaurant"].cuisine)
`)

// ── Site Settings (singleton) ───────────────────────────────────────
export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings"][0] {
    title,
    tagline,
    siteDescription,
    aboutHeading,
    aboutContent,
    aboutImage {
      asset-> { _id, url },
      alt,
      crop,
      hotspot
    },
    logo {
      asset-> { _id, url },
      alt,
      crop,
      hotspot
    },
    ogImage {
      asset-> { _id, url }
    },
    socialLinks
  }
`)

// ── Paginated restaurants (cursor-based for performance) ────────────
export const RESTAURANTS_PAGINATED_QUERY = defineQuery(`
  *[_type == "restaurant" && _id > $lastId] | order(_id) [0...$pageSize] {
    _id,
    name,
    "slug": slug.current,
    location,
    cuisine,
    priceRange,
    ricksScore,
    summary,
    dateVisited,
    mainImage {
      asset-> { _id, url },
      alt,
      crop,
      hotspot
    }
  }
`)
```

### GROQ Performance Rules

1. **Always use explicit projections** -- never return `{...}` in production.
2. **Avoid joins in filters** -- use `_ref` instead of `->` in `where` clauses.
3. **Merge reference resolution** -- dereference once and project multiple fields:
   ```groq
   // SLOW: resolves asset twice
   { "url": mainImage.asset->url, "id": mainImage.asset->_id }

   // FAST: resolve once, project many
   mainImage { asset-> { _id, url } }
   ```
4. **Cursor-based pagination** -- use `_id > $lastId` not offset slicing.
5. **Use `$variables`** -- never interpolate strings into GROQ queries.
6. **Use `coalesce()` for defaults** -- `"score": coalesce(ricksScore, 0)`.
7. **Use `defined()` to filter nulls** -- `*[_type == "restaurant" && defined(slug.current)]`.
8. **Use SCREAMING_SNAKE_CASE** for query variable names.

---

## 6. Sanity Client Setup for Next.js App Router

### Client configuration

File: `src/sanity/client.ts`

```typescript
import { createClient } from 'next-sanity'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-01-01', // use a fixed date, not 'vX'
  useCdn: true, // true for published content; false in draft mode
  // stega is for Visual Editing overlays (optional)
  stega: {
    studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || '/studio',
  },
})
```

### Fetch wrapper with caching and revalidation

File: `src/sanity/fetch.ts`

```typescript
import 'server-only'

import { type QueryParams } from 'next-sanity'
import { draftMode } from 'next/headers'
import { client } from './client'

// Token for preview / draft mode
const token = process.env.SANITY_API_READ_TOKEN

// Dedicated preview client (no CDN, includes drafts)
const previewClient = client.withConfig({
  useCdn: false,
  token,
  perspective: 'drafts',        // see draft documents
  stega: { enabled: true },     // enable click-to-edit overlays
})

/**
 * Universal fetch function for Sanity data.
 *
 * - In production: uses CDN with time-based revalidation (default 60s)
 * - In draft mode:  bypasses CDN, returns draft content with stega overlays
 *
 * Usage in server components:
 *   const data = await sanityFetch({ query: RESTAURANTS_QUERY })
 *   const data = await sanityFetch({
 *     query: RESTAURANT_BY_SLUG_QUERY,
 *     params: { slug: 'some-restaurant' },
 *   })
 */
export async function sanityFetch<T>({
  query,
  params = {},
  revalidate = 60, // seconds -- adjust per route
  tags = [],
}: {
  query: string
  params?: QueryParams
  revalidate?: number | false
  tags?: string[]
}): Promise<T> {
  const isDraft = (await draftMode()).isEnabled

  if (isDraft) {
    // Draft mode: no cache, live drafts
    return previewClient.fetch<T>(query, params)
  }

  // Production: use CDN + Next.js cache
  return client.fetch<T>(query, params, {
    next: {
      revalidate: tags.length > 0 ? false : revalidate,
      tags: tags.length > 0 ? tags : undefined,
    },
  })
}
```

### On-demand revalidation via webhook

File: `src/app/api/revalidate/route.ts`

```typescript
import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'

export async function POST(req: NextRequest) {
  try {
    const { body, isValidSignature } = await parseBody<{
      _type: string
      slug?: { current?: string }
    }>(req, process.env.SANITY_WEBHOOK_SECRET)

    if (!isValidSignature) {
      return new NextResponse('Invalid signature', { status: 401 })
    }

    if (!body?._type) {
      return new NextResponse('Bad request', { status: 400 })
    }

    // Revalidate based on document type
    revalidateTag(body._type)

    // Optionally revalidate specific slug
    if (body.slug?.current) {
      revalidateTag(`restaurant:${body.slug.current}`)
    }

    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (err) {
    console.error('Revalidation error:', err)
    return new NextResponse('Error', { status: 500 })
  }
}
```

### Caching Strategy Summary

| Approach | When to Use | Config |
|----------|-------------|--------|
| Time-based (`revalidate: 60`) | Most pages, simple setup | `sanityFetch({ query, revalidate: 60 })` |
| Tag-based | Fine-grained control, webhook-driven | `sanityFetch({ query, tags: ['restaurant'] })` + webhook |
| No cache (`revalidate: 0`) | Dynamic pages, search results | `sanityFetch({ query, revalidate: 0 })` |
| Draft mode | Preview in Studio Presentation tool | Automatic via `sanityFetch` when `draftMode().isEnabled` |

---

## 7. Image Handling with @sanity/image-url

### Setup

File: `src/sanity/image.ts`

```typescript
import imageUrlBuilder from '@sanity/image-url'
import { type SanityImageSource } from '@sanity/image-url/lib/types/types'
import { client } from './client'

const builder = imageUrlBuilder(client)

/**
 * Generate a Sanity CDN image URL with transformations.
 *
 * Usage:
 *   urlFor(restaurant.mainImage).width(800).height(600).auto('format').url()
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}
```

### SanityImage component

File: `src/components/SanityImage.tsx`

```tsx
import Image from 'next/image'
import { urlFor } from '@/sanity/image'
import { type SanityImageSource } from '@sanity/image-url/lib/types/types'

// Predefined breakpoints for consistent CDN caching
const IMAGE_WIDTHS = [320, 640, 768, 1024, 1280, 1536, 1920]

interface SanityImageProps {
  source: SanityImageSource & { alt?: string }
  alt?: string
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  className?: string
  fill?: boolean
}

export function SanityImage({
  source,
  alt,
  width = 1200,
  height,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  className,
  fill = false,
}: SanityImageProps) {
  if (!source?.asset) return null

  const imageUrl = urlFor(source)
    .width(width)
    .auto('format')     // serves WebP/AVIF based on browser support
    .quality(80)
    .url()

  // Build srcSet for responsive images
  const srcSet = IMAGE_WIDTHS
    .filter((w) => w <= width * 2) // don't generate sizes larger than 2x
    .map((w) => `${urlFor(source).width(w).auto('format').quality(80).url()} ${w}w`)
    .join(', ')

  const altText = alt || source.alt || ''

  if (fill) {
    return (
      <Image
        src={imageUrl}
        alt={altText}
        fill
        sizes={sizes}
        priority={priority}
        className={className}
        srcSet={srcSet}
      />
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={altText}
      width={width}
      height={height || Math.round(width * 0.667)} // default 3:2 aspect
      sizes={sizes}
      priority={priority}
      className={className}
      srcSet={srcSet}
    />
  )
}
```

### Key @sanity/image-url Builder Methods

```typescript
urlFor(image)
  .width(800)             // resize to width
  .height(600)            // resize to height
  .auto('format')         // auto WebP/AVIF based on Accept header
  .quality(80)            // compression quality 0-100 (default 75)
  .fit('crop')            // crop to exact dimensions
  .fit('max')             // scale down only, never up
  .crop('center')         // crop position
  .focalPoint(0.5, 0.3)  // custom focal point
  .blur(50)               // blur effect
  .saturation(-100)       // grayscale
  .dpr(2)                 // device pixel ratio
  .rect(0, 0, 400, 300)  // crop to specific rectangle
  .format('webp')         // force format (prefer auto instead)
  .url()                  // generate the URL string
```

### CDN Caching Best Practices

- **Use predefined widths** (320, 640, 768, 1024, 1280, 1536, 1920) so the CDN
  caches a finite set of transforms instead of unique per-viewport sizes.
- **Always use `auto('format')`** instead of `format('webp')` -- lets the CDN
  serve the optimal format per browser.
- **Use `fit('max')`** for user-uploaded images to prevent upscaling small
  images beyond their native resolution.
- **Include `crop` and `hotspot`** data in your GROQ projections so the builder
  can apply editor-defined focal points.

---

## 8. Portable Text and Markdown Rendering

### Install

```bash
npm install @portabletext/react
```

### PortableText component with custom renderers

File: `src/components/PortableTextRenderer.tsx`

```tsx
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { SanityImage } from './SanityImage'

// Custom components for Portable Text blocks
const components: PortableTextComponents = {
  types: {
    // Inline images within the review body
    image: ({ value }) => (
      <figure className="my-8">
        <SanityImage
          source={value}
          alt={value.alt || ''}
          width={1200}
          priority={false}
          className="rounded-lg"
        />
        {value.caption && (
          <figcaption className="mt-2 text-center text-sm text-gray-500">
            {value.caption}
          </figcaption>
        )}
      </figure>
    ),
  },
  block: {
    h2: ({ children }) => (
      <h2 className="mt-10 mb-4 text-2xl font-bold">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 mb-3 text-xl font-semibold">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-6 mb-2 text-lg font-semibold">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-4 border-amber-500 pl-4 italic text-gray-600">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => (
      <p className="mb-4 leading-relaxed">{children}</p>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    underline: ({ children }) => <span className="underline">{children}</span>,
    'strike-through': ({ children }) => <s>{children}</s>,
    link: ({ value, children }) => {
      const target = value?.openInNewTab ? '_blank' : undefined
      const rel = value?.openInNewTab ? 'noopener noreferrer' : undefined
      return (
        <a
          href={value?.href}
          target={target}
          rel={rel}
          className="text-amber-600 underline hover:text-amber-800"
        >
          {children}
        </a>
      )
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 ml-6 list-disc space-y-1">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 ml-6 list-decimal space-y-1">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
}

interface PortableTextRendererProps {
  value: any[] // Portable Text array from Sanity
  className?: string
}

export function PortableTextRenderer({ value, className }: PortableTextRendererProps) {
  if (!value) return null
  return (
    <div className={className}>
      <PortableText value={value} components={components} />
    </div>
  )
}
```

### Usage in a page

```tsx
// src/app/(blog)/restaurants/[slug]/page.tsx
import { sanityFetch } from '@/sanity/fetch'
import { RESTAURANT_BY_SLUG_QUERY } from '@/sanity/queries'
import { PortableTextRenderer } from '@/components/PortableTextRenderer'
import { SanityImage } from '@/components/SanityImage'

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const restaurant = await sanityFetch<any>({
    query: RESTAURANT_BY_SLUG_QUERY,
    params: { slug },
    tags: [`restaurant:${slug}`],
  })

  if (!restaurant) return <div>Not found</div>

  return (
    <article>
      <h1>{restaurant.name}</h1>
      <SanityImage source={restaurant.mainImage} priority width={1200} />
      <p>{restaurant.summary}</p>

      {/* Render the full Portable Text review */}
      <PortableTextRenderer value={restaurant.review} className="prose" />
    </article>
  )
}
```

### Portable Text vs. Markdown

Sanity strongly favors Portable Text over raw Markdown:

- **Portable Text** is stored as structured JSON, queryable with GROQ, supports
  custom inline blocks (images, embeds, callouts), and renders to any format.
- **Markdown** via `sanity-plugin-markdown` stores raw markdown strings. You
  lose inline image support, custom blocks, and GROQ queryability of content
  structure.
- **Recommendation**: Use Portable Text for the `review` field. The editor
  supports markdown shortcuts (e.g., `**bold**`, `_italic_`, `## Heading`) so
  it feels natural for writers.

---

## 9. Studio Customization

### Structure Builder -- custom navigation

File: `sanity/src/structure/index.ts`

```typescript
import type { StructureResolver } from 'sanity/structure'
import { CogIcon, UtensilsCrossedIcon } from 'lucide-react'

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Rick's Cafe")
    .items([
      // ── Restaurants ─────────────────────────────────────────────
      S.listItem()
        .title('Restaurants')
        .icon(UtensilsCrossedIcon)
        .child(
          S.documentTypeList('restaurant')
            .title('All Restaurants')
            .defaultOrdering([{ field: 'dateVisited', direction: 'desc' }])
        ),

      S.divider(),

      // ── Site Settings (singleton) ───────────────────────────────
      S.listItem()
        .title('Site Settings')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings') // fixed ID = singleton
        ),
    ])
```

### Singleton Pattern Explained

By using a fixed `documentId('siteSettings')`, the Studio always opens the same
document. Combined with removing `siteSettings` from the default document type
list (the Structure Builder replaces the auto-generated list), editors cannot
accidentally create duplicate settings documents.

### Preview Configuration on Document Lists

The `preview` block in the schema (see Section 2) controls what editors see in
the document list. For restaurants, it shows the name, location + score, and the
main image thumbnail.

### Adding Custom Icons

```bash
npm install lucide-react
# or use Sanity's built-in icon set:
npm install @sanity/icons
```

Every document type and list item should have an icon for visual clarity.

### Field Groups Best Practices

- Use groups when a document has more than 5-6 fields.
- Mark the most-used group as `default: true`.
- Add icons to groups for visual scanning:
  ```typescript
  groups: [
    { name: 'details', title: 'Details', icon: InfoIcon, default: true },
    { name: 'scoring', title: 'Scoring', icon: StarIcon },
  ]
  ```

---

## 10. Preview / Draft Mode Setup

### How it works

1. Content editor clicks "Preview" in Sanity Studio's Presentation tool.
2. Studio calls your Next.js app's draft mode endpoint with a secret.
3. Next.js enables `draftMode()`, which changes `sanityFetch` to use the
   preview client (no CDN, drafts perspective, stega overlays).
4. Editor sees live draft content with click-to-edit overlays.

### Enable draft mode endpoint

File: `src/app/api/draft/route.ts`

```typescript
import { defineEnableDraftMode } from 'next-sanity/draft-mode'
import { client } from '@/sanity/client'

export const { GET } = defineEnableDraftMode({
  client: client.withConfig({
    token: process.env.SANITY_API_READ_TOKEN,
  }),
})
```

### Disable draft mode endpoint

File: `src/app/api/draft/disable/route.ts`

```typescript
import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  (await draftMode()).disable()
  return NextResponse.redirect('/')
}
```

### Visual Editing component in layout

File: `src/app/(blog)/layout.tsx`

```tsx
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity'

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isDraft = (await draftMode()).isEnabled

  return (
    <>
      {children}
      {isDraft && (
        <VisualEditing />
      )}
    </>
  )
}
```

### Presentation tool config in sanity.config.ts

```typescript
import { defineConfig } from 'sanity'
import { presentationTool } from 'sanity/presentation'

export default defineConfig({
  // ...other config
  plugins: [
    // ...other plugins
    presentationTool({
      previewUrl: {
        // URL of your Next.js frontend
        origin: process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:3000',
        draftMode: {
          enable: '/api/draft', // matches your route handler
        },
      },
    }),
  ],
})
```

### Environment variables for preview

```env
# In .env.local (Next.js)
SANITY_API_READ_TOKEN=sk...         # Viewer-role token from manage.sanity.io
SANITY_WEBHOOK_SECRET=your-secret   # For on-demand revalidation

# In Studio .env (if separate)
SANITY_STUDIO_PREVIEW_URL=http://localhost:3000
```

---

## 11. Pricing and Free Tier Limitations

### Free Plan (per project)

| Resource | Limit |
|----------|-------|
| Users | 20 |
| Datasets | 2 (public only) |
| Documents | 10,000 |
| API CDN requests | 5M / month |
| API requests | 1M / month |
| Bandwidth | 100 GB / month |
| Asset storage | 100 GB |

Each project gets its own quota -- you can create unlimited free projects.

### Growth Plan -- $15/user/month

| Resource | Limit |
|----------|-------|
| Users | up to 50 |
| Datasets | 2 (public or private) |
| Documents | 25,000 |
| Permission roles | 5 |

### Relevant for Rick's Cafe

The free tier is more than sufficient for a personal food blog:
- 10,000 documents covers hundreds of restaurant reviews.
- 5M CDN requests/month handles significant traffic.
- Public datasets are fine for a blog (no private data).
- Only limitation: no private datasets on Free (not needed here).

**Watch out for**: Image asset storage if uploading many high-res gallery photos.
Optimize uploads or use external hosting (Cloudinary) if approaching 100 GB.

---

## 12. Common Pitfalls and Solutions

### 1. Stale data after publishing

**Problem**: Published content does not appear on the site for several minutes.

**Solutions**:
- Confirm `useCdn: true` is set (CDN cache is faster than API).
- Implement on-demand revalidation via webhooks (Section 6).
- For development, use `revalidate: 0` or `useCdn: false`.

### 2. Images not loading or slow

**Problem**: Images time out or load slowly on first request.

**Solutions**:
- Use predefined srcset widths (not unique per-pixel sizes).
- Always pass integer values to `.width()` and `.height()` (floats cause timeouts).
- Use `.auto('format')` instead of forcing a specific format.
- Include `crop` and `hotspot` in GROQ projections.

### 3. "Objects are not valid as a React child" with Portable Text

**Problem**: Passing raw Portable Text array directly into JSX.

**Solution**: Always use `<PortableText value={content} />` component, never
render the array directly.

### 4. GROQ query returns null for referenced data

**Problem**: Using `->` in filter expressions or not resolving references.

**Solutions**:
- Use `_ref` for filtering: `author._ref == "abc123"` not `author->name == "Bob"`.
- Always dereference in projections: `mainImage { asset-> { _id, url } }`.

### 5. Draft mode token exposed in client bundle

**Problem**: Token leaks to the browser.

**Solution**: Keep token in server-only code. The `sanityFetch` wrapper uses
`'server-only'` import guard. Never import the preview client in client
components.

### 6. Duplicate singleton documents

**Problem**: Multiple "Site Settings" documents created by editors.

**Solution**: Use Structure Builder with a fixed `documentId` (Section 9).
Remove `siteSettings` from the auto-generated document type list.

### 7. Schema changes not reflected in Studio

**Problem**: Studio caches schema on load.

**Solution**: Restart the Studio dev server after schema changes. In production,
redeploy the Studio.

### 8. Slug collisions

**Problem**: Two restaurants get the same slug.

**Solution**: Add uniqueness validation:
```typescript
defineField({
  name: 'slug',
  type: 'slug',
  options: { source: 'name' },
  validation: (rule) =>
    rule.required().custom(async (slug, context) => {
      if (!slug?.current) return 'Slug is required'
      const { document, getClient } = context
      const client = getClient({ apiVersion: '2025-01-01' })
      const existing = await client.fetch(
        `count(*[_type == "restaurant" && slug.current == $slug && _id != $id])`,
        { slug: slug.current, id: document?._id?.replace('drafts.', '') }
      )
      return existing > 0 ? 'Slug already in use' : true
    }),
})
```

### 9. Design-specific field names

**Problem**: Naming fields like `blueCalloutBox` couples content to design.

**Solution**: Use semantic names: `highlightBox`, `callout`, `emphasis`. Content
should describe *what* it is, not *how* it looks.

### 10. Over-fetching with spread operator

**Problem**: Using `{...}` returns every field, including internal ones.

**Solution**: Always use explicit projections listing only the fields you need.
This improves query performance and reduces payload size.

---

## 13. Environment Variables Reference

```env
# ── Sanity Project ───────────────────────────────────────────────────
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id    # from manage.sanity.io
NEXT_PUBLIC_SANITY_DATASET=production             # or 'staging'

# ── API Configuration ────────────────────────────────────────────────
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-01         # fixed date string

# ── Server-only (never prefix with NEXT_PUBLIC_) ─────────────────────
SANITY_API_READ_TOKEN=sk...                       # Viewer role token
SANITY_WEBHOOK_SECRET=your-webhook-secret         # for revalidation

# ── Studio ───────────────────────────────────────────────────────────
NEXT_PUBLIC_SANITY_STUDIO_URL=/studio             # if embedded
SANITY_STUDIO_PREVIEW_URL=http://localhost:3000   # for Presentation tool
```

### Getting your credentials

1. Go to [manage.sanity.io](https://manage.sanity.io)
2. Select your project (or create one)
3. **Project ID**: shown on the project dashboard
4. **API Token**: Settings > API > Tokens > Add API Token (select "Viewer" role)
5. **Webhook Secret**: Settings > API > Webhooks > Create Webhook
   - Set filter: `_type == "restaurant" || _type == "siteSettings"`
   - Set projection: `{ _type, slug }`
   - Set URL: `https://your-domain.com/api/revalidate`

---

## Quick Reference: Package Versions (as of early 2026)

| Package | Purpose |
|---------|---------|
| `sanity` | Studio framework, schema helpers, plugins |
| `next-sanity` | Next.js integration (client, draft mode, visual editing) |
| `@sanity/image-url` | Image CDN URL builder |
| `@sanity/vision` | GROQ query playground in Studio |
| `@portabletext/react` | Portable Text renderer for React/Next.js |
| `lucide-react` or `@sanity/icons` | Icons for schema types and Studio UI |

Install all frontend deps in one command:

```bash
npm install next-sanity @sanity/image-url @portabletext/react
```
