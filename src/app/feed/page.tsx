import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import { toggleLike } from "@/app/social/actions";
import { HeartIcon, CommentIcon } from "@/components/UIIcons";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: workouts } = await supabase
    .from("workouts")
    .select(
      "id, title, notes, photo_url, started_at, user_id, profiles(username, display_name, avatar_url), workout_exercises(count), workout_likes(count), workout_comments(count)"
    )
    .not("finished_at", "is", null)
    .eq("is_public", true)
    .order("started_at", { ascending: false })
    .limit(30);

  const workoutIds = (workouts ?? []).map((w) => w.id);
  const { data: myLikes } = workoutIds.length
    ? await supabase.from("workout_likes").select("workout_id").eq("user_id", user!.id).in("workout_id", workoutIds)
    : { data: [] };
  const likedIds = new Set((myLikes ?? []).map((l) => l.workout_id));

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Feed</h1>
        <Link
          href="/workout/new"
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink"
        >
          Log workout
        </Link>
      </div>

      {(!workouts || workouts.length === 0) && (
        <div className="rounded-lg border border-dashed border-card-border p-6 text-center text-sm text-muted">
          No workouts yet. Log one, or{" "}
          <Link href="/people" className="underline">
            find friends to follow
          </Link>
          .
        </div>
      )}

      <div className="flex flex-col gap-5">
        {(workouts ?? []).map((w) => {
          const author = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles;
          const exerciseCount = Array.isArray(w.workout_exercises)
            ? (w.workout_exercises[0] as { count: number } | undefined)?.count ?? 0
            : 0;
          const likeCount = Array.isArray(w.workout_likes)
            ? (w.workout_likes[0] as { count: number } | undefined)?.count ?? 0
            : 0;
          const commentCount = Array.isArray(w.workout_comments)
            ? (w.workout_comments[0] as { count: number } | undefined)?.count ?? 0
            : 0;
          const iLiked = likedIds.has(w.id);

          return (
            <div key={w.id} className="flex flex-col gap-3 rounded-xl border border-card-border bg-card p-5">
              <Link href={`/workout/${w.id}`} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5 text-sm font-medium text-muted">
                    <Avatar url={author?.avatar_url} name={author?.display_name ?? author?.username ?? "?"} size="md" />
                    {author?.display_name ?? author?.username}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(w.started_at).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-semibold">{w.title}</h2>
                  <p className="text-sm text-muted">{exerciseCount} exercises</p>
                </div>

                {w.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={w.photo_url}
                    alt=""
                    className="max-h-96 w-full rounded-lg border border-card-border object-cover"
                  />
                )}

                {w.notes && <p className="text-sm italic text-muted">&ldquo;{w.notes}&rdquo;</p>}
              </Link>

              <div className="flex items-center gap-4 border-t border-card-border pt-3">
                <form action={toggleLike.bind(null, w.id)}>
                  <button
                    type="submit"
                    className={`flex items-center gap-1.5 text-sm ${iLiked ? "text-accent" : "text-muted"}`}
                  >
                    <HeartIcon size={18} filled={iLiked} />
                    {likeCount > 0 && <span className="tnum">{likeCount}</span>}
                  </button>
                </form>
                <Link href={`/workout/${w.id}#comments`} className="flex items-center gap-1.5 text-sm text-muted">
                  <CommentIcon size={18} />
                  {commentCount > 0 && <span className="tnum">{commentCount}</span>}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
