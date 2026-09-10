"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toKg, type WeightUnit } from "@/lib/units";

export async function addGoal(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const exerciseId = String(formData.get("exerciseId") ?? "");
  const targetWeightRaw = Number(formData.get("targetWeightKg"));
  const unit = (formData.get("unit") as WeightUnit | null) ?? "kg";
  const targetDate = String(formData.get("targetDate") ?? "") || null;

  if (!exerciseId) throw new Error("Pick an exercise.");
  if (!targetWeightRaw || targetWeightRaw <= 0) throw new Error("Enter a target weight.");

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    exercise_id: exerciseId,
    target_weight_kg: toKg(targetWeightRaw, unit),
    target_date: targetDate,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/progress");
}

export async function deleteGoal(goalId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("goals").delete().eq("id", goalId).eq("user_id", user.id);
  revalidatePath("/progress");
}
