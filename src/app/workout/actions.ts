"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SetInput = {
  weight: number | null;
  reps: number | null;
  isWarmup: boolean;
  completed: boolean;
};

export type ExerciseInput = {
  exerciseId: string;
  sets: SetInput[];
};

export async function saveWorkout(input: {
  title: string;
  notes?: string | null;
  exercises: ExerciseInput[];
  isPublic?: boolean;
  photoUrl?: string | null;
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
      is_warmup: s.isWarmup,
      completed: s.completed,
    }));

    const { error: setsError } = await supabase.from("workout_sets").insert(setsPayload);
    if (setsError) throw new Error(setsError.message);
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

  const usable = input.exercises.filter((e) => e.targetSets > 0);
  if (usable.length === 0) {
    throw new Error("Add at least one exercise before saving the plan.");
  }

  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .insert({ user_id: user.id, name: input.name || "Plan" })
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

  revalidatePath("/workouts");
  redirect("/workouts");
}
