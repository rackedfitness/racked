import { createClient } from "@/lib/supabase/server";
import WorkoutBuilder from "@/components/WorkoutBuilder";
import { computeBestEverMap, computeLastWeightMap, type WorkoutLite } from "@/lib/stats";
import type { Sex } from "@/lib/rankSystem";

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; savePlan?: string; resume?: string }>;
}) {
  const { template: templateId, savePlan, resume } = await searchParams;
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

  const { data: latestMeasurement } = await supabase
    .from("body_measurements")
    .select("weight_kg")
    .eq("user_id", user!.id)
    .not("weight_kg", "is", null)
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const bodyweightKg = latestMeasurement?.weight_kg ?? null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("age, sex")
    .eq("id", user!.id)
    .single();

  let initialExercises: {
    exerciseId: string;
    name: string;
    equipment: string | null;
    category: string | null;
    targetSets: number;
    targetReps: number | null;
    templateExerciseId?: string;
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
      .select("id, exercise_id, order_index, target_sets, target_reps, exercises(name, equipment, category)")
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
        templateExerciseId: te.id,
      };
    });
  }

  return (
    <WorkoutBuilder
      exercises={exercises ?? []}
      initialTitle={initialTitle}
      initialExercises={initialExercises}
      savePlanMode={savePlan === "1"}
      resumeMode={resume === "1"}
      bestEver={bestEver}
      lastKnownWeight={lastKnownWeight}
      bodyweightKg={bodyweightKg}
      age={profile?.age ?? null}
      sex={(profile?.sex as Sex | null) ?? null}
      userId={user!.id}
    />
  );
}
