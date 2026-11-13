import { createClient } from "@/lib/supabase/server";

export type FollowStatus = "following" | "requested" | "none";

// Your relationship to every other user in one round trip, so list pages
// (people, followers, search) can label each row Following / Requested /
// Follow without a query per row.
export async function getMyFollowStatusLookup(userId: string): Promise<(otherId: string) => FollowStatus> {
  const supabase = await createClient();
  const [{ data: following }, { data: requested }] = await Promise.all([
    supabase.from("follows").select("following_id").eq("follower_id", userId),
    supabase.from("follow_requests").select("target_id").eq("requester_id", userId),
  ]);
  const followingIds = new Set((following ?? []).map((f) => f.following_id as string));
  const requestedIds = new Set((requested ?? []).map((r) => r.target_id as string));
  return (otherId) => (followingIds.has(otherId) ? "following" : requestedIds.has(otherId) ? "requested" : "none");
}
