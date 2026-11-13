import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";
import { getMyFollowStatusLookup } from "@/lib/followState";
import PersonRow from "@/components/PersonRow";
import { ArrowLeftIcon } from "@/components/UIIcons";

type ProfileLite = { id: string; username: string; display_name: string | null; avatar_url: string | null };

// Shared body of /profile/[username]/followers and /following.
export default async function FollowList({ username, mode }: { username: string; mode: "followers" | "following" }) {
  const supabase = await createClient();
  const user = await getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, is_private")
    .eq("username", username)
    .single();
  if (!profile) notFound();

  const statusOf = await getMyFollowStatusLookup(user!.id);
  const isSelf = profile.id === user?.id;
  // The database hides these rows anyway; this just explains why the list is empty.
  const canSee = isSelf || !profile.is_private || statusOf(profile.id) === "following";

  let people: ProfileLite[] = [];
  if (canSee) {
    const { data: rows } =
      mode === "followers"
        ? await supabase
            .from("follows")
            .select("profiles!follows_follower_id_fkey(id, username, display_name, avatar_url)")
            .eq("following_id", profile.id)
        : await supabase
            .from("follows")
            .select("profiles!follows_following_id_fkey(id, username, display_name, avatar_url)")
            .eq("follower_id", profile.id);
    people = (rows ?? [])
      .map((r) => (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles))
      .filter((p): p is ProfileLite => Boolean(p));
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href={`/profile/${profile.username}`} className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="truncate text-xl font-bold">
          {profile.display_name ?? profile.username}
          <span className="font-sans text-base font-normal text-muted">
            {" "}
            · {mode === "followers" ? "Followers" : "Following"}
          </span>
        </h1>
      </div>

      {!canSee ? (
        <div className="rounded-lg border border-dashed border-card-border p-6 text-center text-sm text-muted">
          🔒 This account is private. Follow them to see who they follow and who follows them.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-card-border">
          {people.map((p) => (
            <PersonRow key={p.id} profile={p} status={statusOf(p.id)} isSelf={p.id === user?.id} />
          ))}
          {people.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">
              {mode === "followers" ? "No followers yet." : "Not following anyone yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
