import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import { toggleLike } from "@/app/social/actions";
import { HeartIcon, CommentIcon } from "@/components/UIIcons";
import { attachPRCounts, formatWorkoutDuration, type WorkoutLite } from "@/lib/stats";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: workouts, error: workoutsError } = await supabase
    .from("workouts")
    .select(
      "id, title, notes, photo_url, started_at, finished_at, user_id, profiles!workouts_user_id_fkey(username, display_name, avatar_url), workout_exercises(count)"
    )
    .not("finished_at", "is", null)
    .eq("is_public", true)
    .order("started_at", { ascending: false })
    .limit(30);

  if (workoutsError) {
    console.error("Feed query failed:", workoutsError);
  }

  // PR counts need each author's full workout history (to know what was
  // already a best before this one), so fetch per unique author rather than
  // per workout — a handful of extra queries instead of one per card.
  const authorIds = [...new Set((workouts ?? []).map((w) => w.user_id))];
  const prCountByWorkout = new Map<string, number>();
  await Promise.all(
    authorIds.map(async (authorId) => {
      const { data: authorWorkouts } = await supabase
        .from("workouts")
        .select(
          "id, title, started_at, finished_at, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup))"
        )
        .eq("user_id", authorId)
        .not("finished_at", "is", null)
        .order("started_at");
      const withPRs = attachPRCounts((authorWorkouts ?? []) as unknown as WorkoutLite[]);
      for (const w of withPRs) prCountByWorkout.set(w.id, w.prCount);
    })
  );

  // Fetched as separate queries rather than embedded (count) joins on the
  // main select — a workout with zero likes/comments could otherwise be
  // silently dropped from the results if either embed resolves as an inner
  // join instead of a left join.
  const workoutIds = (workouts ?? []).map((w) => w.id);

  const { data: allLikes } = workoutIds.length
    ? await supabase.from("workout_likes").select("workout_id, user_id").in("workout_id", workoutIds)
    : { data: [] };
  const likeCounts = new Map<string, number>();
  const likedIds = new Set<string>();
  for (const l of allLikes ?? []) {
    likeCounts.set(l.workout_id, (likeCounts.get(l.workout_id) ?? 0) + 1);
    if (l.user_id === user!.id) likedIds.add(l.workout_id);
  }

  const { data: allComments } = workoutIds.length
    ? await supabase.from("workout_comments").select("workout_id").in("workout_id", workoutIds)
    : { data: [] };
  const commentCounts = new Map<string, number>();
  for (const c of allComments ?? []) {
    commentCounts.set(c.workout_id, (commentCounts.get(c.workout_id) ?? 0) + 1);
  }

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

      {workoutsError ? (
        <div className="rounded-lg border border-red-400/40 bg-red-400/10 p-6 text-center text-sm text-red-400">
          Couldn&rsquo;t load the feed: {workoutsError.message}
        </div>
      ) : (
        (!workouts || workouts.length === 0) && (
          <div className="rounded-lg border border-dashed border-card-border p-6 text-center text-sm text-muted">
            No workouts yet. Log one, or{" "}
            <Link href="/people" className="underline">
              find friends to follow
            </Link>
            .
          </div>
        )
      )}

      <div className="flex flex-col gap-5">
        {(workouts ?? []).map((w) => {
          const author = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles;
          const exerciseCount = Array.isArray(w.workout_exercises)
            ? (w.workout_exercises[0] as { count: number } | undefined)?.count ?? 0
            : 0;
          const likeCount = likeCounts.get(w.id) ?? 0;
          const commentCount = commentCounts.get(w.id) ?? 0;
          const iLiked = likedIds.has(w.id);
          const prCount = prCountByWorkout.get(w.id) ?? 0;
          const durationSeconds = w.finished_at
            ? Math.max(0, Math.round((new Date(w.finished_at).getTime() - new Date(w.started_at).getTime()) / 1000))
            : null;

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
                  <div className="tnum flex items-center gap-2 text-sm text-muted">
                    <span>{exerciseCount} exercises</span>
                    {durationSeconds !== null && <span>· {formatWorkoutDuration(durationSeconds)}</span>}
                    {prCount > 0 && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-sans text-accent">
                        {prCount} PR{prCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
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
