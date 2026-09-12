import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return NextResponse.json({ results: [] });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ results: [] });

  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .neq("id", user.id)
    .ilike("username", `%${q}%`)
    .limit(20);

  const candidates = data ?? [];

  // Mutual-connection count per candidate — how many people *you* follow
  // also follow them — the same signal Instagram's search ranks by. Fetched
  // as one extra query (my following list) plus one count query scoped to
  // just these candidates, rather than N+1 per result.
  const mutualCounts = new Map<string, number>();
  if (candidates.length > 0) {
    const { data: myFollowing } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
    const myFollowingIds = (myFollowing ?? []).map((f) => f.following_id);

    if (myFollowingIds.length > 0) {
      const { data: mutuals } = await supabase
        .from("follows")
        .select("following_id")
        .in("follower_id", myFollowingIds)
        .in(
          "following_id",
          candidates.map((c) => c.id)
        );
      for (const m of mutuals ?? []) {
        mutualCounts.set(m.following_id, (mutualCounts.get(m.following_id) ?? 0) + 1);
      }
    }
  }

  // Ranked the way Instagram's search does: closest text match first
  // (usernames starting with the query beat ones that merely contain it),
  // then by mutual-connection count, then alphabetically as a tiebreaker.
  const lower = q.toLowerCase();
  const results = candidates
    .sort((a, b) => {
      const aStarts = a.username.toLowerCase().startsWith(lower) ? 0 : 1;
      const bStarts = b.username.toLowerCase().startsWith(lower) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;

      const aMutuals = mutualCounts.get(a.id) ?? 0;
      const bMutuals = mutualCounts.get(b.id) ?? 0;
      if (aMutuals !== bMutuals) return bMutuals - aMutuals;

      return a.username.localeCompare(b.username);
    })
    .slice(0, 6)
    .map((c) => ({ ...c, mutualCount: mutualCounts.get(c.id) ?? 0 }));

  return NextResponse.json({ results });
}
