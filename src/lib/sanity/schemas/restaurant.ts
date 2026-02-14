// Sanity schema definition for restaurant documents
// Import this into your Sanity Studio's schema configuration

const restaurant = {
  name: "restaurant",
  title: "Restaurant",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "location",
      title: "Location",
      type: "object",
      fields: [
        { name: "address", title: "Address", type: "string" },
        { name: "city", title: "City", type: "string" },
        { name: "state", title: "State", type: "string" },
        {
          name: "coordinates",
          title: "Coordinates",
          type: "geopoint",
        },
      ],
    },
    {
      name: "cuisine",
      title: "Cuisine",
      type: "string",
    },
    {
      name: "priceRange",
      title: "Price Range",
      type: "string",
      options: {
        list: [
          { title: "$", value: "$" },
          { title: "$$", value: "$$" },
          { title: "$$$", value: "$$$" },
          { title: "$$$$", value: "$$$$" },
        ],
      },
    },
    {
      name: "scores",
      title: "Scores",
      type: "object",
      fields: [
        {
          name: "taste",
          title: "Taste",
          type: "number",
          validation: (Rule: any) => Rule.min(1).max(10),
        },
        {
          name: "vibe",
          title: "Vibe",
          type: "number",
          validation: (Rule: any) => Rule.min(1).max(10),
        },
        {
          name: "service",
          title: "Service",
          type: "number",
          validation: (Rule: any) => Rule.min(1).max(10),
        },
        {
          name: "value",
          title: "Value",
          type: "number",
          validation: (Rule: any) => Rule.min(1).max(10),
        },
      ],
    },
    {
      name: "rickFactor",
      title: "The Rick Factor",
      type: "object",
      fields: [
        {
          name: "score",
          title: "Score",
          type: "number",
          validation: (Rule: any) => Rule.min(1).max(10),
        },
        {
          name: "description",
          title: "What Makes It Special",
          type: "text",
        },
      ],
    },
    {
      name: "summary",
      title: "Summary",
      type: "text",
      description: "Short summary for timeline cards",
    },
    {
      name: "review",
      title: "Full Review",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "Quote", value: "blockquote" },
          ],
        },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "caption",
              title: "Caption",
              type: "string",
            },
          ],
        },
      ],
    },
    {
      name: "gallery",
      title: "Photo Gallery",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            { name: "caption", title: "Caption", type: "string" },
            { name: "alt", title: "Alt Text", type: "string" },
          ],
        },
      ],
    },
    {
      name: "dateVisited",
      title: "Date Visited",
      type: "date",
      validation: (Rule: any) => Rule.required(),
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "cuisine",
      media: "gallery.0",
    },
  },
};

export default restaurant;
