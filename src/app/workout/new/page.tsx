import { createClient } from "@/lib/supabase/server";
import WorkoutBuilder from "@/components/WorkoutBuilder";
import { computeBestEverMap, computeLastWeightMap, type WorkoutLite } from "@/lib/stats";

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; savePlan?: string }>;
}) {
  const { template: templateId, savePlan } = await searchParams;
  const supabase = await createClient();

  const { data: exercises } = await supabase.from("exercises").select("*").order("name");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rawWorkouts } = await supabase
    .from("workouts")
    .select(
      "id, title, started_at, finished_at, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup, set_index))"
    )
    .eq("user_id", user!.id)
    .not("finished_at", "is", null)
    .order("set_index", { referencedTable: "workout_exercises.workout_sets" });

  const historyWorkouts = (rawWorkouts ?? []) as unknown as WorkoutLite[];
  const bestEver = computeBestEverMap(historyWorkouts);
  const lastKnownWeight = computeLastWeightMap(historyWorkouts);

  let initialExercises: {
    exerciseId: string;
    name: string;
    equipment: string | null;
    category: string | null;
    targetSets: number;
    targetReps: number | null;
  }[] = [];
  let initialTitle = "Workout";

  if (templateId) {
    const { data: template } = await supabase
      .from("workout_templates")
      .select("name")
      .eq("id", templateId)
      .single();

    const { data: templateExercises } = await supabase
      .from("workout_template_exercises")
      .select("exercise_id, order_index, target_sets, target_reps, exercises(name, equipment, category)")
      .eq("template_id", templateId)
      .order("order_index");

    if (template) initialTitle = template.name;

    initialExercises = (templateExercises ?? []).map((te) => {
      const exerciseInfo = Array.isArray(te.exercises) ? te.exercises[0] : te.exercises;
      return {
        exerciseId: te.exercise_id,
        name: exerciseInfo?.name ?? "Exercise",
        equipment: exerciseInfo?.equipment ?? null,
        category: exerciseInfo?.category ?? null,
        targetSets: te.target_sets,
        targetReps: te.target_reps,
      };
    });
  }

  return (
    <WorkoutBuilder
      exercises={exercises ?? []}
      initialTitle={initialTitle}
      initialExercises={initialExercises}
      savePlanMode={savePlan === "1"}
      bestEver={bestEver}
      lastKnownWeight={lastKnownWeight}
      userId={user!.id}
    />
  );
}
