"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GYM_TAGS } from "@/lib/gymTags";

const VALID_TAGS = new Set<string>(GYM_TAGS.map((t) => t.value));

export type GymReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  body: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  profiles: { username: string; display_name: string | null; avatar_url: string | null } | null;
};

export async function submitGymReview(input: {
  placeId: string;
  gymName: string;
  gymAddress?: string | null;
  lat?: number | null;
  lng?: number | null;
  rating: number;
  body?: string | null;
  tags: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!input.placeId || !input.gymName) throw new Error("Missing gym.");
  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) throw new Error("Rating must be 1-5.");
  const tags = (input.tags ?? []).filter((t) => VALID_TAGS.has(t));

  const { error } = await supabase.from("gym_reviews").upsert(
    {
      place_id: input.placeId,
      gym_name: input.gymName,
      gym_address: input.gymAddress || null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      user_id: user.id,
      rating,
      body: input.body?.trim() || null,
      tags,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "place_id,user_id" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/gyms");
  revalidatePath("/gyms/detail");
}

export async function deleteGymReview(reviewId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("gym_reviews").delete().eq("id", reviewId).eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/gyms");
  revalidatePath("/gyms/detail");
}

export async function getGymReviews(placeId: string): Promise<{ reviews: GymReviewRow[]; myReviewId: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("gym_reviews")
    .select("id, user_id, rating, body, tags, created_at, updated_at, profiles!gym_reviews_user_id_fkey(username, display_name, avatar_url)")
    .eq("place_id", placeId)
    .order("created_at", { ascending: false });

  const reviews = (data ?? []) as unknown as GymReviewRow[];
  const mine = user ? reviews.find((r) => r.user_id === user.id) : undefined;
  return { reviews, myReviewId: mine?.id ?? null };
}

export type ReviewedGym = {
  placeId: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  avgRating: number;
  reviewCount: number;
};

// Powers the map on /gyms — every gym any Racked user has reviewed, one pin
// per place_id. Aggregated in JS rather than a DB view since review volume
// is small at this stage; revisit if that stops being true.
export async function getReviewedGyms(): Promise<ReviewedGym[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gym_reviews")
    .select("place_id, gym_name, gym_address, lat, lng, rating");

  const byPlace = new Map<string, { name: string; address: string | null; lat: number | null; lng: number | null; ratings: number[] }>();
  for (const r of data ?? []) {
    const existing = byPlace.get(r.place_id);
    if (existing) {
      existing.ratings.push(r.rating);
      if (!existing.lat && r.lat) existing.lat = r.lat;
      if (!existing.lng && r.lng) existing.lng = r.lng;
    } else {
      byPlace.set(r.place_id, { name: r.gym_name, address: r.gym_address, lat: r.lat, lng: r.lng, ratings: [r.rating] });
    }
  }

  return Array.from(byPlace.entries()).map(([placeId, g]) => ({
    placeId,
    name: g.name,
    address: g.address,
    lat: g.lat,
    lng: g.lng,
    avgRating: g.ratings.reduce((sum, n) => sum + n, 0) / g.ratings.length,
    reviewCount: g.ratings.length,
  }));
}
