import Link from "next/link";
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/SubmitButton";
import { follow, unfollow } from "@/app/social/actions";
import type { FollowStatus } from "@/lib/followState";

export default function PersonRow({
  profile,
  status,
  isSelf,
}: {
  profile: { id: string; username: string; display_name: string | null; avatar_url: string | null };
  status: FollowStatus;
  isSelf: boolean;
}) {
  // unfollow also cancels a pending request
  const action = status === "none" ? follow.bind(null, profile.id) : unfollow.bind(null, profile.id);

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
          <SubmitButton
            className={
              status === "none"
                ? "glow-accent-sm rounded-full bg-accent px-3 py-2 text-sm font-bold text-accent-ink"
                : "rounded-full border border-card-border px-3 py-2 text-sm font-medium text-muted"
            }
          >
            {status === "following" ? "Following" : status === "requested" ? "Requested" : "Follow"}
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
