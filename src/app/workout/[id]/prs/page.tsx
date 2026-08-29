import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computePREvents, type WorkoutLite } from "@/lib/stats";
import { ArrowLeftIcon } from "@/components/UIIcons";

export default async function WorkoutPRsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: workout } = await supabase
    .from("workouts")
    .select("id, title, started_at, user_id")
    .eq("id", id)
    .single();

  if (!workout) notFound();

  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select("exercise_id, exercises(name)")
    .eq("workout_id", id);

  const exerciseNames: Record<string, string> = {};
  for (const we of workoutExercises ?? []) {
    const info = Array.isArray(we.exercises) ? we.exercises[0] : we.exercises;
    if (info?.name) exerciseNames[we.exercise_id] = info.name;
  }

  const { data: allWorkouts } = await supabase
    .from("workouts")
    .select("id, title, started_at, finished_at, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup))")
    .eq("user_id", workout.user_id)
    .not("finished_at", "is", null)
    .order("started_at");

  const prEvents = computePREvents((allWorkouts ?? []) as unknown as WorkoutLite[]).filter(
    (e) => e.workoutId === id
  );

  const dateLabel = new Date(workout.started_at).toLocaleDateString();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href={`/workout/${id}`} className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">New PRs</h1>
          <p className="text-sm text-muted">
            {workout.title} — {dateLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {prEvents.map((e) => (
          <div key={e.exerciseId} className="rounded-lg border border-accent bg-accent/10 p-3">
            <h3 className="font-semibold">{exerciseNames[e.exerciseId] ?? "Exercise"}</h3>
            <p className="tnum text-sm text-muted">
              {e.weight}kg × {e.reps} reps <span className="text-accent">— new PR</span>
            </p>
            <p className="tnum text-xs text-muted">Est. 1RM: {Math.round(e.est1RM)}kg</p>
          </div>
        ))}

        {prEvents.length === 0 && <p className="text-sm text-muted">No PRs in this workout.</p>}
      </div>
    </div>
  );
}
