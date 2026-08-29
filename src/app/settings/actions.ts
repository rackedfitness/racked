"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "");
  const email = String(formData.get("email") ?? "");
  const sex = String(formData.get("sex") ?? "");
  const ageRaw = String(formData.get("age") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      sex: sex === "male" || sex === "female" ? sex : null,
      age: ageRaw ? Number(ageRaw) : null,
    })
    .eq("id", user.id);

  if (email && email !== user.email) {
    await supabase.auth.updateUser({ email });
  }

  revalidatePath("/settings");
  revalidatePath("/profile/[username]", "page");
}

export async function updateAvatar(url: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/profile/[username]", "page");
  revalidatePath("/feed");
  revalidatePath("/people");
}

export async function exportMyData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: workouts } = await supabase
    .from("workouts")
    .select("*, workout_exercises(*, workout_sets(*))")
    .eq("user_id", user.id);
  const { data: measurements } = await supabase
    .from("body_measurements")
    .select("*")
    .eq("user_id", user.id);

  return JSON.stringify({ profile, workouts, measurements }, null, 2);
}

export async function deleteMyData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("workouts").delete().eq("user_id", user.id);
  await supabase.from("workout_templates").delete().eq("user_id", user.id);
  await supabase.from("body_measurements").delete().eq("user_id", user.id);

  revalidatePath("/");
  redirect("/");
}
