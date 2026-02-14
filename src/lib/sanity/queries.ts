import { sanityClient, isSanityConfigured } from "./client";

// Timeline: lightweight query for the homepage
export async function getTimelineRestaurants() {
  if (!isSanityConfigured) return [];
  return sanityClient.fetch(`
    *[_type == "restaurant"] | order(dateVisited desc) {
      _id,
      name,
      slug,
      cuisine,
      priceRange,
      "heroImage": gallery[0],
      "overallScore": math::avg([scores.taste, scores.vibe, scores.service, scores.value]),
      dateVisited,
      summary
    }
  `);
}

// Detail: full restaurant data
export async function getRestaurant(slug: string) {
  if (!isSanityConfigured) return null;
  return sanityClient.fetch(
    `
    *[_type == "restaurant" && slug.current == $slug][0] {
      _id,
      name,
      slug,
      location,
      cuisine,
      priceRange,
      scores,
      rickFactor,
      summary,
      review,
      gallery[] {
        asset->,
        caption,
        alt
      },
      dateVisited
    }
  `,
    { slug }
  );
}

// All slugs for static generation
export async function getAllRestaurantSlugs() {
  if (!isSanityConfigured) return [];
  return sanityClient.fetch(`
    *[_type == "restaurant"] { "slug": slug.current }
  `);
}

// Site settings (about page content)
export async function getSiteSettings() {
  if (!isSanityConfigured) return null;
  return sanityClient.fetch(`
    *[_type == "siteSettings"][0] {
      title,
      description,
      originStory,
      timelineEvents[] {
        year,
        title,
        description
      }
    }
  `);
}
