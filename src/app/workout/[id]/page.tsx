import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import PostWorkoutButton from "@/components/PostWorkoutButton";
import BackButton from "@/components/BackButton";
import { computePREvents, formatDuration, formatVolume, formatWorkoutDuration, type WorkoutLite } from "@/lib/stats";
import { estimateCaloriesForCardioSet } from "@/lib/calories";
import { toggleLike, addComment, deleteComment } from "@/app/social/actions";
import { HeartIcon } from "@/components/UIIcons";
import { computeRankUpEvents, type Sex } from "@/lib/rankSystem";
import RankUpRecap from "@/components/RankUpRecap";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Only two things are hard dependencies of everything else: knowing who's
  // asking (user) and which workout this is + who owns it (workout). Every
  // other query below only needs workout.user_id/id/user.id, which are both
  // known after this pair — so they all fire together instead of one at a
  // time. This page used to be a ~10-query waterfall; it's 3 round trips now.
  const [{ data: user }, { data: workout }] = await Promise.all([
    supabase.auth.getUser().then((r) => ({ data: r.data.user })),
    supabase
      .from("workouts")
      .select("id, title, notes, photo_url, started_at, finished_at, user_id, gym_name, gym_address")
      .eq("id", id)
      .single(),
  ]);

  if (!workout) notFound();

  const [
    { data: author },
    { data: workoutExercises },
    { data: latestMeasurement },
    { data: allWorkouts },
    { count: likeCount },
    { data: myLike },
    { data: comments },
  ] = await Promise.all([
    supabase.from("profiles").select("username, display_name, avatar_url, age, sex").eq("id", workout.user_id).single(),
    supabase
      .from("workout_exercises")
      .select("id, order_index, exercise_id, notes, exercises(name, category)")
      .eq("workout_id", id)
      .order("order_index"),
    supabase
      .from("body_measurements")
      .select("weight_kg")
      .eq("user_id", workout.user_id)
      .not("weight_kg", "is", null)
      .order("logged_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workouts")
      .select("id, title, started_at, finished_at, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup))")
      .eq("user_id", workout.user_id)
      .not("finished_at", "is", null)
      .order("started_at"),
    supabase.from("workout_likes").select("*", { count: "exact", head: true }).eq("workout_id", id),
    supabase.from("workout_likes").select("workout_id").eq("workout_id", id).eq("user_id", user!.id).maybeSingle(),
    supabase
      .from("workout_comments")
      .select("id, body, created_at, user_id, profiles(username, display_name, avatar_url)")
      .eq("workout_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const exerciseIds = (workoutExercises ?? []).map((we) => we.id);
  const { data: sets } = exerciseIds.length
    ? await supabase
        .from("workout_sets")
        .select("id, workout_exercise_id, set_index, weight, reps, distance_km, duration_seconds, is_warmup")
        .in("workout_exercise_id", exerciseIds)
        .order("set_index")
    : { data: [] };

  const dateLabel = new Date(workout.started_at).toLocaleDateString();
  const exerciseCount = workoutExercises?.length ?? 0;
  const summary = `${workout.title} — ${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"} on ${dateLabel}`;

  const durationSeconds = workout.finished_at
    ? Math.max(0, Math.round((new Date(workout.finished_at).getTime() - new Date(workout.started_at).getTime()) / 1000))
    : null;

  const volume = (sets ?? []).reduce((total, s) => (s.weight && s.reps ? total + s.weight * s.reps : total), 0);

  const bodyweightKg = latestMeasurement?.weight_kg ?? null;

  const exerciseInfoByWE: Record<string, { name: string; category: string | null }> = {};
  for (const we of workoutExercises ?? []) {
    const info = Array.isArray(we.exercises) ? we.exercises[0] : we.exercises;
    if (info) exerciseInfoByWE[we.id] = info;
  }

  const caloriesBurned = (sets ?? []).reduce((total, s) => {
    const info = exerciseInfoByWE[s.workout_exercise_id];
    if (!info || info.category !== "cardio") return total;
    return (
      total +
      estimateCaloriesForCardioSet({
        exerciseName: info.name,
        distanceKm: s.distance_km,
        durationSeconds: s.duration_seconds,
        bodyweightKg,
      })
    );
  }, 0);

  const prEvents = computePREvents((allWorkouts ?? []) as unknown as WorkoutLite[]).filter(
    (e) => e.workoutId === id
  );

  const canRank = Boolean(bodyweightKg && author?.age && author?.sex);
  let rankUpEvents: ReturnType<typeof computeRankUpEvents> = [];
  if (canRank) {
    const { data: allExercises } = await supabase.from("exercises").select("id, name");
    const exerciseNames = Object.fromEntries((allExercises ?? []).map((e) => [e.id, e.name]));
    rankUpEvents = computeRankUpEvents({
      workouts: (allWorkouts ?? []) as unknown as WorkoutLite[],
      exerciseNames,
      bodyweightKg: bodyweightKg!,
      age: author!.age!,
      sex: author!.sex as Sex,
    }).filter((e) => e.workoutId === id);
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BackButton />
            <h1 className="truncate text-xl font-bold">{workout.title}</h1>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <Avatar
              url={author?.avatar_url}
              name={author?.display_name ?? author?.username ?? "?"}
              size="sm"
            />
            {author && (
              <Link href={`/profile/${author.username}`} className="text-sm text-accent underline">
                {author.display_name ?? author.username}
              </Link>
            )}
          </div>
          {workout.gym_name && (
            <p className="mt-1 truncate text-xs text-muted">
              <span aria-hidden>📍</span> {workout.gym_name}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm text-muted">{dateLabel}</p>
          {workout.notes && (
            <p className="mt-1 max-w-[9rem] text-xs italic text-muted">&ldquo;{workout.notes}&rdquo;</p>
          )}
        </div>
      </div>

      {workout.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={workout.photo_url}
          alt=""
          className="w-full rounded-lg border border-card-border object-cover"
        />
      )}

      <div className="flex items-center gap-4">
        <form action={toggleLike.bind(null, id)}>
          <button
            type="submit"
            className={`flex items-center gap-1.5 text-sm ${myLike ? "text-accent" : "text-muted"}`}
          >
            <HeartIcon size={20} filled={Boolean(myLike)} />
            {(likeCount ?? 0) > 0 && <span className="tnum">{likeCount}</span>}
          </button>
        </form>
        <a href="#comments" className="flex items-center gap-1.5 text-sm text-muted">
          {(comments?.length ?? 0)} comment{(comments?.length ?? 0) === 1 ? "" : "s"}
        </a>
      </div>

      {durationSeconds !== null && (
        <div
          className={`grid gap-2 rounded-lg border border-card-border bg-card p-3 text-center ${
            caloriesBurned > 0 ? "grid-cols-4" : "grid-cols-3"
          }`}
        >
          <div>
            <p className="tnum text-lg font-bold">{formatWorkoutDuration(durationSeconds)}</p>
            <p className="text-xs text-muted">Time</p>
          </div>
          <div>
            {volume > 0 ? (
              <Link href={`/workout/${id}/volume`} className="block">
                <p className="tnum text-lg font-bold text-accent underline decoration-accent/40 underline-offset-2">
                  {formatVolume(volume)}
                </p>
              </Link>
            ) : (
              <p className="tnum text-lg font-bold">{formatVolume(volume)}</p>
            )}
            <p className="text-xs text-muted">Volume</p>
          </div>
          <div>
            {prEvents.length > 0 ? (
              <Link href={`/workout/${id}/prs`} className="block">
                <p className="tnum text-lg font-bold text-accent underline decoration-accent/40 underline-offset-2">
                  {prEvents.length}
                </p>
              </Link>
            ) : (
              <p className="tnum text-lg font-bold">{prEvents.length}</p>
            )}
            <p className="text-xs text-muted">New PRs</p>
          </div>
          {caloriesBurned > 0 && (
            <div>
              <p className="tnum text-lg font-bold">{Math.round(caloriesBurned)}</p>
              <p className="text-xs text-muted">Calories</p>
            </div>
          )}
        </div>
      )}

      {rankUpEvents.length > 0 && (
        <>
          <RankUpRecap
            events={rankUpEvents.map((e) => ({ exerciseName: e.label, rank: e.rank }))}
          />
          <div className="flex flex-wrap gap-2">
            {rankUpEvents.map((e) => (
              <span
                key={e.exerciseId}
                className="rounded-full border px-2.5 py-1 text-xs font-semibold"
                style={{
                  borderColor: `${e.rank.color}88`,
                  backgroundColor: `${e.rank.color}22`,
                  color: e.rank.color,
                }}
              >
                {e.label} ranked up to {e.rank.label}
              </span>
            ))}
          </div>
        </>
      )}

      <div className="flex flex-col gap-4">
        {(workoutExercises ?? []).map((we) => {
          const exerciseSets = (sets ?? []).filter((s) => s.workout_exercise_id === we.id);
          const exerciseInfo = exerciseInfoByWE[we.id];
          return (
            <div key={we.id} className="rounded-lg border border-card-border bg-card p-3">
              <h3 className="mb-2 font-semibold">{exerciseInfo?.name}</h3>
              <div className="flex flex-col gap-1">
                {exerciseSets.map((s) => (
                  <div key={s.id} className="tnum flex gap-4 text-sm text-muted">
                    <span className="w-6 text-muted">{s.set_index + 1}</span>
                    {exerciseInfo?.category === "cardio" ? (
                      <>
                        <span>{s.distance_km ?? "-"} km</span>
                        <span>{s.duration_seconds != null ? formatDuration(s.duration_seconds) : "-"}</span>
                      </>
                    ) : (
                      <>
                        <span>{s.weight ?? "-"} kg</span>
                        <span>{s.reps ?? "-"} reps</span>
                      </>
                    )}
                    {s.is_warmup && <span className="font-sans text-xs font-normal text-muted">warmup</span>}
                  </div>
                ))}
              </div>
              {we.notes && (
                <p className="mt-2 text-sm italic text-muted">&ldquo;{we.notes}&rdquo;</p>
              )}
            </div>
          );
        })}
      </div>

      <div id="comments" className="flex flex-col gap-3 scroll-mt-6">
        <h2 className="font-semibold">
          Comments{(comments?.length ?? 0) > 0 ? ` (${comments!.length})` : ""}
        </h2>

        <form action={addComment.bind(null, id)} className="flex gap-2">
          <input
            key={comments?.length ?? 0}
            name="body"
            maxLength={500}
            placeholder="Add a comment..."
            className="flex-1 rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted"
          />
          <button
            type="submit"
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-ink"
          >
            Post
          </button>
        </form>

        <div className="flex flex-col gap-3">
          {(comments ?? []).map((c) => {
            const commenter = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
            return (
              <div key={c.id} className="flex items-start gap-2.5">
                <Avatar
                  url={commenter?.avatar_url}
                  name={commenter?.display_name ?? commenter?.username ?? "?"}
                  size="sm"
                />
                <div className="min-w-0 flex-1 rounded-lg border border-card-border bg-card p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {commenter?.display_name ?? commenter?.username}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm">{c.body}</p>
                  {c.user_id === user?.id && (
                    <form action={deleteComment.bind(null, c.id, id)} className="mt-1">
                      <button type="submit" className="text-xs text-muted active:text-red-400">
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}

          {(comments?.length ?? 0) === 0 && (
            <p className="text-sm text-muted">No comments yet.</p>
          )}
        </div>
      </div>

      <PostWorkoutButton title={workout.title} summary={summary} />
    </div>
  );
}
