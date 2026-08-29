import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import PostWorkoutButton from "@/components/PostWorkoutButton";
import { computePREvents, formatVolume, type WorkoutLite } from "@/lib/stats";

function formatSetDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatWorkoutDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: workout } = await supabase
    .from("workouts")
    .select("id, title, notes, photo_url, started_at, finished_at, user_id")
    .eq("id", id)
    .single();

  if (!workout) notFound();

  const { data: author } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", workout.user_id)
    .single();

  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select("id, order_index, exercise_id, exercises(name, category)")
    .eq("workout_id", id)
    .order("order_index");

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

  const { data: allWorkouts } = await supabase
    .from("workouts")
    .select("id, title, started_at, finished_at, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup))")
    .eq("user_id", workout.user_id)
    .not("finished_at", "is", null)
    .order("started_at");

  const prEvents = computePREvents((allWorkouts ?? []) as unknown as WorkoutLite[]).filter(
    (e) => e.workoutId === id
  );

  const exerciseNames: Record<string, string> = {};
  for (const we of workoutExercises ?? []) {
    const info = Array.isArray(we.exercises) ? we.exercises[0] : we.exercises;
    if (info?.name) exerciseNames[we.exercise_id] = info.name;
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">{workout.title}</h1>
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

      {durationSeconds !== null && (
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-card-border bg-card p-3 text-center">
          <div>
            <p className="tnum text-lg font-bold">{formatWorkoutDuration(durationSeconds)}</p>
            <p className="text-xs text-muted">Time</p>
          </div>
          <div>
            <p className="tnum text-lg font-bold">{formatVolume(volume)}</p>
            <p className="text-xs text-muted">Volume</p>
          </div>
          <div>
            <p className="tnum text-lg font-bold">{prEvents.length}</p>
            <p className="text-xs text-muted">New PRs</p>
          </div>
        </div>
      )}

      {prEvents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {prEvents.map((e) => (
            <span
              key={e.exerciseId}
              className="rounded-full border border-accent bg-accent/15 px-2.5 py-1 text-xs text-accent"
            >
              {exerciseNames[e.exerciseId] ?? "Exercise"} PR — {e.weight}kg × {e.reps}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {(workoutExercises ?? []).map((we) => {
          const exerciseSets = (sets ?? []).filter((s) => s.workout_exercise_id === we.id);
          const exerciseInfo = Array.isArray(we.exercises) ? we.exercises[0] : we.exercises;
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
                        <span>{s.duration_seconds != null ? formatSetDuration(s.duration_seconds) : "-"}</span>
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
            </div>
          );
        })}
      </div>

      <PostWorkoutButton title={workout.title} summary={summary} />
    </div>
  );
}
