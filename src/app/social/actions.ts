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

  if (followingId !== user.id) {
    await supabase.from("notifications").insert({ user_id: followingId, actor_id: user.id, type: "follow" });
  }

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

    const { data: workout } = await supabase.from("workouts").select("user_id").eq("id", workoutId).single();
    if (workout && workout.user_id !== user.id) {
      await supabase
        .from("notifications")
        .insert({ user_id: workout.user_id, actor_id: user.id, type: "like", workout_id: workoutId });
    }
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

  const { data: comment, error } = await supabase
    .from("workout_comments")
    .insert({ workout_id: workoutId, user_id: user.id, body })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { data: workout } = await supabase.from("workouts").select("user_id").eq("id", workoutId).single();
  if (workout && workout.user_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: workout.user_id,
      actor_id: user.id,
      type: "comment",
      workout_id: workoutId,
      comment_id: comment?.id ?? null,
    });
  }

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

export async function markNotificationsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  revalidatePath("/notifications");
}
