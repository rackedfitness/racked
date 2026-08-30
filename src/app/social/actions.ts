"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function follow(followingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("follows").insert({ follower_id: user.id, following_id: followingId });
  revalidatePath("/people");
  revalidatePath("/profile");
  revalidatePath("/");
}

export async function unfollow(followingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);
  revalidatePath("/people");
  revalidatePath("/profile");
  revalidatePath("/");
}

export async function toggleLike(workoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("workout_likes")
    .select("workout_id")
    .eq("workout_id", workoutId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("workout_likes").delete().eq("workout_id", workoutId).eq("user_id", user.id);
  } else {
    await supabase.from("workout_likes").insert({ workout_id: workoutId, user_id: user.id });
  }

  revalidatePath(`/workout/${workoutId}`);
  revalidatePath("/feed");
}

export async function addComment(workoutId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Comment can't be empty.");
  if (body.length > 500) throw new Error("Comment is too long.");

  const { error } = await supabase.from("workout_comments").insert({
    workout_id: workoutId,
    user_id: user.id,
    body,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/workout/${workoutId}`);
}

export async function deleteComment(commentId: string, workoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("workout_comments").delete().eq("id", commentId).eq("user_id", user.id);
  revalidatePath(`/workout/${workoutId}`);
}
