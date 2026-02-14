import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import { sanityConfig } from "./config";

type SanityImageSource = Parameters<ReturnType<typeof createImageUrlBuilder>["image"]>[0];

const isSanityConfigured = !!sanityConfig.projectId;

export const sanityClient = createClient({
  ...sanityConfig,
  projectId: sanityConfig.projectId || "placeholder",
  stega: { enabled: false },
});

const builder = createImageUrlBuilder(sanityClient);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export { isSanityConfigured };
