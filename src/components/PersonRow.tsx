import Link from "next/link";
import Avatar from "@/components/Avatar";
import { follow, unfollow } from "@/app/social/actions";

export default function PersonRow({
  profile,
  isFollowing,
  isSelf,
}: {
  profile: { id: string; username: string; display_name: string | null; avatar_url: string | null };
  isFollowing: boolean;
  isSelf: boolean;
}) {
  const action = isFollowing ? unfollow.bind(null, profile.id) : follow.bind(null, profile.id);

  return (
    <div className="flex items-center justify-between py-3">
      <Link href={`/profile/${profile.username}`} className="flex items-center gap-2 text-sm">
        <Avatar url={profile.avatar_url} name={profile.display_name ?? profile.username} size="sm" />
        <span>
          <span className="font-medium">{profile.display_name ?? profile.username}</span>
          <span className="ml-2 text-muted">@{profile.username}</span>
        </span>
      </Link>
      {!isSelf && (
        <form action={action}>
          <button
            type="submit"
            className={
              isFollowing
                ? "rounded-full border border-card-border px-3 py-2 text-sm font-medium text-muted"
                : "glow-accent-sm rounded-full bg-accent px-3 py-2 text-sm font-bold text-accent-ink"
            }
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </form>
      )}
    </div>
  );
}
