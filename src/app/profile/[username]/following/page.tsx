import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PersonRow from "@/components/PersonRow";
import { ArrowLeftIcon } from "@/components/UIIcons";

type ProfileLite = { id: string; username: string; display_name: string | null; avatar_url: string | null };

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const { data: rows } = await supabase
    .from("follows")
    .select("profiles!follows_following_id_fkey(id, username, display_name, avatar_url)")
    .eq("follower_id", profile.id);

  const people = (rows ?? [])
    .map((r) => (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles))
    .filter((p): p is ProfileLite => Boolean(p));

  const { data: myFollowing } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user?.id ?? "");

  const myFollowingIds = new Set((myFollowing ?? []).map((f) => f.following_id));

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href={`/profile/${profile.username}`} className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="truncate text-xl font-bold">
          {profile.display_name ?? profile.username}
          <span className="font-sans text-base font-normal text-muted"> · Following</span>
        </h1>
      </div>

      <div className="flex flex-col divide-y divide-card-border">
        {people.map((p) => (
          <PersonRow key={p.id} profile={p} isFollowing={myFollowingIds.has(p.id)} isSelf={p.id === user?.id} />
        ))}

        {people.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">Not following anyone yet.</p>
        )}
      </div>
    </div>
  );
}
