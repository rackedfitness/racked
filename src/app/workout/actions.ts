"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SetInput = {
  weight: number | null;
  reps: number | null;
  distanceKm: number | null;
  durationSeconds: number | null;
  isWarmup: boolean;
  completed: boolean;
};

export type ExerciseInput = {
  exerciseId: string;
  sets: SetInput[];
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Shared by saveTemplate (the standalone "build a plan" flow) and saveWorkout's
// "also save as a plan" option — inserts the template + its exercises without
// redirecting, so callers can decide what happens next.
async function createTemplateRows(
  supabase: SupabaseServerClient,
  userId: string,
  input: { name: string; exercises: { exerciseId: string; targetSets: number; targetReps: number | null }[] }
) {
  const usable = input.exercises.filter((e) => e.targetSets > 0);
  if (usable.length === 0) return;

  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .insert({ user_id: userId, name: input.name || "Plan" })
    .select("id")
    .single();

  if (templateError || !template) {
    throw new Error(templateError?.message ?? "Failed to save plan");
  }

  const payload = usable.map((e, i) => ({
    template_id: template.id,
    exercise_id: e.exerciseId,
    order_index: i,
    target_sets: e.targetSets,
    target_reps: e.targetReps,
  }));

  const { error: exercisesError } = await supabase.from("workout_template_exercises").insert(payload);
  if (exercisesError) throw new Error(exercisesError.message);
}

export async function saveWorkout(input: {
  title: string;
  notes?: string | null;
  exercises: ExerciseInput[];
  isPublic?: boolean;
  photoUrl?: string | null;
  startedAt: string;
  alsoSaveAsPlan?: { name: string } | null;
  planSwaps?: { templateExerciseId: string; newExerciseId: string }[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const usableExercises = input.exercises.filter((e) => e.sets.length > 0);
  if (usableExercises.length === 0) {
    throw new Error("Add at least one set before finishing the workout.");
  }

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      title: input.title || "Workout",
      notes: input.notes || null,
      photo_url: input.photoUrl || null,
      is_public: input.isPublic ?? true,
      started_at: input.startedAt,
      finished_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (workoutError || !workout) {
    throw new Error(workoutError?.message ?? "Failed to create workout");
  }

  for (let i = 0; i < usableExercises.length; i++) {
    const ex = usableExercises[i];

    const { data: workoutExercise, error: weError } = await supabase
      .from("workout_exercises")
      .insert({
        workout_id: workout.id,
        exercise_id: ex.exerciseId,
        order_index: i,
      })
      .select("id")
      .single();

    if (weError || !workoutExercise) {
      throw new Error(weError?.message ?? "Failed to save exercise");
    }

    const setsPayload = ex.sets.map((s, idx) => ({
      workout_exercise_id: workoutExercise.id,
      set_index: idx,
      weight: s.weight,
      reps: s.reps,
      distance_km: s.distanceKm,
      duration_seconds: s.durationSeconds,
      is_warmup: s.isWarmup,
      completed: s.completed,
    }));

    const { error: setsError } = await supabase.from("workout_sets").insert(setsPayload);
    if (setsError) throw new Error(setsError.message);
  }

  if (input.alsoSaveAsPlan) {
    await createTemplateRows(supabase, user.id, {
      name: input.alsoSaveAsPlan.name,
      exercises: usableExercises.map((e) => ({
        exerciseId: e.exerciseId,
        targetSets: e.sets.length,
        targetReps: e.sets.find((s) => s.reps)?.reps ?? null,
      })),
    });
    revalidatePath("/workouts");
  }

  for (const swap of input.planSwaps ?? []) {
    const { error: swapError } = await supabase
      .from("workout_template_exercises")
      .update({ exercise_id: swap.newExerciseId })
      .eq("id", swap.templateExerciseId);
    if (swapError) throw new Error(swapError.message);
  }
  if (input.planSwaps && input.planSwaps.length > 0) {
    revalidatePath("/workouts");
  }

  revalidatePath("/");
  redirect(`/workout/${workout.id}`);
}

export async function saveTemplate(input: {
  name: string;
  exercises: { exerciseId: string; targetSets: number; targetReps: number | null }[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (input.exercises.filter((e) => e.targetSets > 0).length === 0) {
    throw new Error("Add at least one exercise before saving the plan.");
  }

  await createTemplateRows(supabase, user.id, input);

  revalidatePath("/workouts");
  redirect("/workouts");
}
