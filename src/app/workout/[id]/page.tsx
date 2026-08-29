import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import PostWorkoutButton from "@/components/PostWorkoutButton";

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
        .select("id, workout_exercise_id, set_index, weight, reps, is_warmup")
        .in("workout_exercise_id", exerciseIds)
        .order("set_index")
    : { data: [] };

  const dateLabel = new Date(workout.started_at).toLocaleDateString();
  const exerciseCount = workoutExercises?.length ?? 0;
  const summary = `${workout.title} — ${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"} on ${dateLabel}`;

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
                    <span>{s.weight ?? "-"} kg</span>
                    <span>{s.reps ?? "-"} reps</span>
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
