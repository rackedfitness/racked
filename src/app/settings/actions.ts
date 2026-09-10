"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { stripe } from "@/lib/stripe";

export async function updateProfile(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "");
  const email = String(formData.get("email") ?? "");
  const sex = String(formData.get("sex") ?? "");
  const ageRaw = String(formData.get("age") ?? "");
  const weightUnit = String(formData.get("weightUnit") ?? "");

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
      weight_unit: weightUnit === "lbs" ? "lbs" : "kg",
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

// Full account deletion, distinct from deleteMyData() above (which only
// wipes content and keeps the account/login). Deletes the auth user itself
// via the service-role admin API — every table referencing profiles.id was
// built with "on delete cascade" (workouts, comments, likes, follows,
// goals, blocks, notifications, subscriptions, reports, ...), so removing
// the auth user cascades through all of it in one step rather than needing
// to manually delete each table and risk missing one.
export async function deleteMyAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscription?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    } catch {
      // If it's already canceled/missing on Stripe's side, that's fine —
      // don't let a Stripe hiccup block the account deletion itself.
    }
  }

  const adminClient = createServiceRoleClient();
  const { error } = await adminClient.auth.admin.deleteUser(user.id);
  if (error) throw new Error(error.message);

  try {
    await supabase.auth.signOut();
  } catch {
    // The account is already gone at this point either way — worst case
    // the local session cookie lingers until it naturally expires.
  }
  redirect("/");
}
