"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GYM_TAGS } from "@/lib/gymTags";

const VALID_TAGS = new Set<string>(GYM_TAGS.map((t) => t.value));

// Reviews are anonymous to other users — no reviewer identity is returned,
// only whether a given review is your own. (Tied to identity, reviews
// revealed which gyms, including hotel gyms while travelling, a specific
// person uses.)
export type GymReviewRow = {
  id: string;
  rating: number;
  body: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  is_mine: boolean;
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
      body: input.body?.trim().slice(0, 1000) || null,
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
  const { data } = await supabase.rpc("gym_reviews_for_place", { p_place_id: placeId });

  const reviews = (data ?? []) as GymReviewRow[];
  const mine = reviews.find((r) => r.is_mine);
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
// per place_id, aggregated in the database (reviewed_gyms) so no individual
// reviewer's identity ever leaves it.
export async function getReviewedGyms(): Promise<ReviewedGym[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("reviewed_gyms");

  type Row = {
    place_id: string;
    gym_name: string;
    gym_address: string | null;
    lat: number | null;
    lng: number | null;
    avg_rating: number | string;
    review_count: number | string;
  };
  return ((data ?? []) as Row[]).map((g) => ({
    placeId: g.place_id,
    name: g.gym_name,
    address: g.gym_address,
    lat: g.lat,
    lng: g.lng,
    avgRating: Number(g.avg_rating),
    reviewCount: Number(g.review_count),
  }));
}
