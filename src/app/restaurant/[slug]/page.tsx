import { notFound } from "next/navigation";
import { getRestaurant, getAllRestaurantSlugs } from "@/lib/sanity/queries";
import { RestaurantDetail } from "./RestaurantDetail";
import type { Restaurant } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllRestaurantSlugs();
  return slugs.map((s: { slug: string }) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const restaurant: Restaurant | null = await getRestaurant(slug);
  if (!restaurant) return { title: "Not Found" };

  return {
    title: `${restaurant.name} | Rick's Cafe`,
    description: restaurant.summary,
  };
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params;
  const restaurant: Restaurant | null = await getRestaurant(slug);

  if (!restaurant) notFound();

  return <RestaurantDetail restaurant={restaurant} />;
}
