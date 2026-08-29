import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatVolume } from "@/lib/stats";
import { ArrowLeftIcon } from "@/components/UIIcons";

export default async function WorkoutVolumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: workout } = await supabase
    .from("workouts")
    .select("id, title, started_at")
    .eq("id", id)
    .single();

  if (!workout) notFound();

  const { data: workoutExercises } = await supabase
    .from("workout_exercises")
    .select("id, order_index, exercise_id, exercises(name)")
    .eq("workout_id", id)
    .order("order_index");

  const exerciseIds = (workoutExercises ?? []).map((we) => we.id);
  const { data: sets } = exerciseIds.length
    ? await supabase.from("workout_sets").select("workout_exercise_id, weight, reps").in("workout_exercise_id", exerciseIds)
    : { data: [] };

  const volumeByExercise = (workoutExercises ?? [])
    .map((we) => {
      const info = Array.isArray(we.exercises) ? we.exercises[0] : we.exercises;
      const exerciseSets = (sets ?? []).filter((s) => s.workout_exercise_id === we.id);
      const volume = exerciseSets.reduce((total, s) => (s.weight && s.reps ? total + s.weight * s.reps : total), 0);
      return { exerciseId: we.exercise_id, name: info?.name ?? "Exercise", volume };
    })
    .filter((e) => e.volume > 0)
    .sort((a, b) => b.volume - a.volume);

  const dateLabel = new Date(workout.started_at).toLocaleDateString();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href={`/workout/${id}`} className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Volume by exercise</h1>
          <p className="text-sm text-muted">
            {workout.title} — {dateLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {volumeByExercise.map((e) => (
          <div
            key={e.exerciseId}
            className="flex items-center justify-between rounded-lg border border-card-border bg-card p-3"
          >
            <h3 className="font-semibold">{e.name}</h3>
            <span className="tnum text-sm text-muted">{formatVolume(e.volume)}</span>
          </div>
        ))}

        {volumeByExercise.length === 0 && <p className="text-sm text-muted">No weighted sets in this workout.</p>}
      </div>
    </div>
  );
}
