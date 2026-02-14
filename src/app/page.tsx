import { getTimelineRestaurants } from "@/lib/sanity/queries";
import { HomeClient } from "./HomeClient";
import type { TimelineRestaurant } from "@/lib/types";

export default async function Home() {
  let restaurants: TimelineRestaurant[] = [];

  try {
    restaurants = await getTimelineRestaurants();
  } catch {
    // Sanity not connected yet — render with mock data
  }

  return <HomeClient restaurants={restaurants} />;
}
