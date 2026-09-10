"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addGoal(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const exerciseId = String(formData.get("exerciseId") ?? "");
  const targetWeightKg = Number(formData.get("targetWeightKg"));
  const targetDate = String(formData.get("targetDate") ?? "") || null;

  if (!exerciseId) throw new Error("Pick an exercise.");
  if (!targetWeightKg || targetWeightKg <= 0) throw new Error("Enter a target weight.");

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    exercise_id: exerciseId,
    target_weight_kg: targetWeightKg,
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
