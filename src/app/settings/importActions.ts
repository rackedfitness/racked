"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseImportCsv } from "@/lib/csvImport";
import type { WeightUnit } from "@/lib/units";

export type ImportSummary = {
  workoutsImported: number;
  setsImported: number;
  exercisesCreated: number;
  skippedRows: number;
  format: "strong" | "hevy";
};

// Imported workouts are always private (is_public: false) — bulk-importing
// years of history shouldn't suddenly flood followers' feeds. That also
// means pr_count is left null/uncomputed for them: Feed (the only place
// that reads the cached value) only ever shows public workouts, so there's
// nothing for a stale/missing pr_count to get wrong.
export async function importWorkoutsCsv(formData: FormData): Promise<ImportSummary> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a CSV file to import.");
  }
  const unit: WeightUnit = String(formData.get("unit") ?? "kg") === "lbs" ? "lbs" : "kg";

  const text = await file.text();
  const result = parseImportCsv(text, unit);
  if (!result.ok) throw new Error(result.error);

  const usableWorkouts = result.workouts.filter((w) => w.exercises.some((e) => e.sets.length > 0));
  if (usableWorkouts.length === 0) {
    throw new Error("No usable workouts found in that file.");
  }

  const { data: existingExercises } = await supabase.from("exercises").select("id, name");
  const exerciseIdByName = new Map<string, string>();
  for (const e of existingExercises ?? []) exerciseIdByName.set(e.name.toLowerCase(), e.id);

  const neededByLower = new Map<string, string>();
  for (const w of usableWorkouts) {
    for (const e of w.exercises) {
      const lower = e.name.toLowerCase();
      if (!neededByLower.has(lower)) neededByLower.set(lower, e.name);
    }
  }
  const missingNames = [...neededByLower.entries()]
    .filter(([lower]) => !exerciseIdByName.has(lower))
    .map(([, name]) => name);

  let exercisesCreated = 0;
  if (missingNames.length > 0) {
    const { data: created, error: createError } = await supabase
      .from("exercises")
      .insert(missingNames.map((name) => ({ name, created_by: user.id })))
      .select("id, name");
    if (createError) throw new Error(createError.message);
    for (const e of created ?? []) exerciseIdByName.set(e.name.toLowerCase(), e.id);
    exercisesCreated = created?.length ?? 0;
  }

  // Every id is pre-assigned client-side so the whole import is 3 bulk
  // inserts total, regardless of size — a per-row round trip here would
  // risk timing out on a large export.
  const workoutRows: Record<string, unknown>[] = [];
  const exerciseRows: Record<string, unknown>[] = [];
  const setRows: Record<string, unknown>[] = [];
  let setsImported = 0;

  for (const w of usableWorkouts) {
    const workoutId = crypto.randomUUID();
    const finishedAt = w.finishedAt ?? w.startedAt;
    workoutRows.push({
      id: workoutId,
      user_id: user.id,
      title: w.title || "Workout",
      is_public: false,
      started_at: w.startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
    });

    let orderIndex = 0;
    for (const e of w.exercises) {
      if (e.sets.length === 0) continue;
      const exerciseId = exerciseIdByName.get(e.name.toLowerCase());
      if (!exerciseId) continue;

      const workoutExerciseId = crypto.randomUUID();
      exerciseRows.push({
        id: workoutExerciseId,
        workout_id: workoutId,
        exercise_id: exerciseId,
        order_index: orderIndex++,
      });

      e.sets.forEach((s, idx) => {
        setRows.push({
          workout_exercise_id: workoutExerciseId,
          set_index: idx,
          weight: s.weightKg,
          reps: s.reps,
          distance_km: s.distanceKm,
          duration_seconds: s.durationSeconds,
          is_warmup: s.isWarmup,
          completed: true,
        });
        setsImported++;
      });
    }
  }

  const { error: workoutsError } = await supabase.from("workouts").insert(workoutRows);
  if (workoutsError) throw new Error(workoutsError.message);

  const { error: exercisesError } = await supabase.from("workout_exercises").insert(exerciseRows);
  if (exercisesError) throw new Error(exercisesError.message);

  const { error: setsError } = await supabase.from("workout_sets").insert(setRows);
  if (setsError) throw new Error(setsError.message);

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/progress");
  revalidatePath("/workouts");

  return {
    workoutsImported: workoutRows.length,
    setsImported,
    exercisesCreated,
    skippedRows: result.skippedRows,
    format: result.format,
  };
}
