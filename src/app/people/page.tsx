import { createClient } from "@/lib/supabase/server";
import PersonRow from "@/components/PersonRow";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profilesQuery = supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .neq("id", user?.id ?? "")
    .order("username")
    .limit(30);

  if (q) {
    profilesQuery = profilesQuery.ilike("username", `%${q}%`);
  }

  const { data: profiles } = await profilesQuery;

  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user?.id ?? "");

  const followingIds = new Set((following ?? []).map((f) => f.following_id));

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <h1 className="text-xl font-bold">Find friends</h1>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by username"
          className="flex-1 rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted"
        />
        <button
          type="submit"
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-ink"
        >
          Search
        </button>
      </form>

      <div className="flex flex-col divide-y divide-card-border">
        {(profiles ?? []).map((p) => (
          <PersonRow key={p.id} profile={p} isFollowing={followingIds.has(p.id)} isSelf={false} />
        ))}

        {profiles && profiles.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">No users found.</p>
        )}
      </div>
    </div>
  );
}
