const siteSettings = {
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Site Title",
      type: "string",
    },
    {
      name: "description",
      title: "Site Description",
      type: "text",
    },
    {
      name: "originStory",
      title: "Origin Story",
      type: "array",
      of: [{ type: "block" }],
      description:
        "The full Rick's Cafe origin story for the About page",
    },
    {
      name: "timelineEvents",
      title: "Timeline of the Name",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "year", title: "Year", type: "string" },
            { name: "title", title: "Title", type: "string" },
            {
              name: "description",
              title: "Description",
              type: "text",
            },
          ],
        },
      ],
    },
  ],
  preview: {
    select: { title: "title" },
  },
};

export default siteSettings;
