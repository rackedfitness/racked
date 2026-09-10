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

  // Usernames starting with the query are the closest match to what was
  // typed, so they surface first — ilike alone only guarantees a substring,
  // not where it occurs.
  const lower = q.toLowerCase();
  const results = (data ?? [])
    .sort((a, b) => {
      const aStarts = a.username.toLowerCase().startsWith(lower) ? 0 : 1;
      const bStarts = b.username.toLowerCase().startsWith(lower) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.username.localeCompare(b.username);
    })
    .slice(0, 6);

  return NextResponse.json({ results });
}
