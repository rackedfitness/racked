import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import MarkNotificationsReadOnMount from "@/components/MarkNotificationsReadOnMount";
import SubmitButton from "@/components/SubmitButton";
import { acceptFollowRequest, declineFollowRequest } from "@/app/social/actions";
import { ArrowLeftIcon } from "@/components/UIIcons";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const user = await getUser();

  const [{ data: rawNotifications }, { data: requests }] = await Promise.all([
    supabase
      .from("notifications")
      .select(
        "id, type, read, created_at, workout_id, actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url), workouts(title)"
      )
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("follow_requests")
      .select("requester_id, created_at, requester:profiles!follow_requests_requester_id_fkey(username, display_name, avatar_url)")
      .eq("target_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  // Pending requests get their own section with Accept/Decline below, so
  // their notifications would just be duplicates in the main list.
  const notifications = (rawNotifications ?? []).filter((n) => n.type !== "follow_request");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <MarkNotificationsReadOnMount />

      <div className="flex items-center gap-3">
        <Link href="/feed" className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-bold">Notifications</h1>
      </div>

      {requests && requests.length > 0 && (
        <div>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">
            Follow requests ({requests.length})
          </h2>
          <div className="flex flex-col divide-y divide-card-border">
            {requests.map((r) => {
              const requester = Array.isArray(r.requester) ? r.requester[0] : r.requester;
              const name = requester?.display_name ?? requester?.username ?? "Someone";
              return (
                <div key={r.requester_id} className="flex items-center gap-3 py-3">
                  <Link href={`/profile/${requester?.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar url={requester?.avatar_url} name={name} size="sm" />
                    <p className="truncate text-sm">
                      <span className="font-medium">{name}</span>{" "}
                      <span className="text-muted">wants to follow you</span>
                    </p>
                  </Link>
                  <form action={acceptFollowRequest.bind(null, r.requester_id)}>
                    <SubmitButton className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-ink">
                      Accept
                    </SubmitButton>
                  </form>
                  <form action={declineFollowRequest.bind(null, r.requester_id)}>
                    <SubmitButton className="rounded-full border border-card-border px-3 py-1.5 text-xs font-medium text-muted">
                      Decline
                    </SubmitButton>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col divide-y divide-card-border">
        {notifications.map((n) => {
          const actor = Array.isArray(n.actor) ? n.actor[0] : n.actor;
          const workout = Array.isArray(n.workouts) ? n.workouts[0] : n.workouts;
          const actorName = actor?.display_name ?? actor?.username ?? "Someone";
          const text =
            n.type === "follow"
              ? "started following you"
              : n.type === "follow_accepted"
                ? "accepted your follow request"
                : n.type === "like"
                  ? `liked your workout${workout?.title ? ` "${workout.title}"` : ""}`
                  : `commented on your workout${workout?.title ? ` "${workout.title}"` : ""}`;
          const href =
            n.type === "follow" || n.type === "follow_accepted"
              ? `/profile/${actor?.username}`
              : `/workout/${n.workout_id}`;

          return (
            <Link
              key={n.id}
              href={href}
              className={`flex items-center gap-3 py-3 ${n.read ? "" : "bg-accent/5"}`}
            >
              <Avatar url={actor?.avatar_url} name={actorName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{actorName}</span> {text}
                </p>
                <p className="text-xs text-muted">{new Date(n.created_at).toLocaleDateString()}</p>
              </div>
              {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
            </Link>
          );
        })}

        {notifications.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
