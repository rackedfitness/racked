import { createClient } from "@/lib/supabase/server";
import { workoutVolume, workoutBestSetPerExercise, type WorkoutLite } from "@/lib/stats";
import ProgressCharts from "@/components/ProgressCharts";
import { logMeasurement } from "@/app/progress/actions";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rawWorkouts } = await supabase
    .from("workouts")
    .select(
      "id, title, started_at, finished_at, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup))"
    )
    .eq("user_id", user!.id)
    .not("finished_at", "is", null)
    .order("started_at", { ascending: true });

  const workouts = (rawWorkouts ?? []) as unknown as WorkoutLite[];

  const volumeData = workouts.map((w) => ({
    date: new Date(w.started_at).toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
    volume: Math.round(workoutVolume(w)),
  }));

  const exerciseIds = new Set<string>();
  for (const w of workouts) for (const we of w.workout_exercises) exerciseIds.add(we.exercise_id);

  const { data: exercises } = exerciseIds.size
    ? await supabase.from("exercises").select("id, name").in("id", [...exerciseIds])
    : { data: [] };

  const oneRMByExercise: Record<string, { date: string; value: number }[]> = {};
  for (const w of workouts) {
    const best = workoutBestSetPerExercise(w);
    const date = new Date(w.started_at).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    });
    for (const [exerciseId, b] of best) {
      oneRMByExercise[exerciseId] ??= [];
      oneRMByExercise[exerciseId].push({ date, value: Math.round(b.est1RM) });
    }
  }

  const { data: measurements } = await supabase
    .from("body_measurements")
    .select("id, weight_kg, note, logged_at")
    .eq("user_id", user!.id)
    .order("logged_at", { ascending: false })
    .limit(10);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <h1 className="text-xl font-bold">Progress</h1>

      <ProgressCharts
        volumeData={volumeData}
        exercises={(exercises ?? []).sort((a, b) => a.name.localeCompare(b.name))}
        oneRMByExercise={oneRMByExercise}
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Body measurements</h2>
        </div>

        <form action={logMeasurement} className="mb-3 flex gap-2">
          <input
            name="weightKg"
            type="number"
            step="0.1"
            placeholder="Weight (kg)"
            className="flex-1 rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted"
          />
          <button
            type="submit"
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-ink"
          >
            + Log
          </button>
        </form>

        <div className="rounded-lg border border-card-border bg-card p-4">
          {measurements && measurements.length > 0 ? (
            <div className="flex flex-col gap-2">
              {measurements.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    {new Date(m.logged_at).toLocaleDateString()}
                  </span>
                  <span>{m.weight_kg ? `${m.weight_kg} kg` : "-"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted">No measurements logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
