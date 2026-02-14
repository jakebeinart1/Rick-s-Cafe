export interface Restaurant {
  _id: string;
  name: string;
  slug: { current: string };
  location: {
    address: string;
    city: string;
    state: string;
    coordinates?: { lat: number; lng: number };
  };
  cuisine: string;
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  scores: {
    taste: number;
    vibe: number;
    service: number;
    value: number;
  };
  rickFactor: {
    score: number;
    description: string;
  };
  summary: string;
  review: any[]; // Sanity portable text blocks
  gallery: GalleryImage[];
  dateVisited: string;
}

export interface GalleryImage {
  _key?: string;
  asset: {
    _ref: string;
    url?: string;
  };
  caption?: string;
  alt?: string;
}

export interface TimelineRestaurant {
  _id: string;
  name: string;
  slug: { current: string };
  cuisine: string;
  priceRange: string;
  heroImage: GalleryImage;
  overallScore: number;
  dateVisited: string;
  summary: string;
}

export interface SiteSettings {
  title: string;
  description: string;
  originStory: any[];
  timelineEvents: {
    year: string;
    title: string;
    description: string;
  }[];
}
