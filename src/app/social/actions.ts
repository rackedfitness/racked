"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertUuid } from "@/lib/validation";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Checked in both directions — a block should stop contact regardless of
// which side initiated it. The database enforces this too (RLS); this is
// just for a friendly error message instead of a silent no-op.
// Notifications for follows/likes/comments are created by database
// triggers, not here, so they can't be forged by a client.
async function isBlockedEitherWay(supabase: SupabaseServerClient, userA: string, userB: string): Promise<boolean> {
  assertUuid(userA);
  assertUuid(userB);
  const { data } = await supabase
    .from("blocks")
    .select("blocker_id")
    .or(
      `and(blocker_id.eq.${userA},blocked_id.eq.${userB}),and(blocker_id.eq.${userB},blocked_id.eq.${userA})`
    )
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

export async function follow(followingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  assertUuid(followingId, "user");

  if (await isBlockedEitherWay(supabase, user.id, followingId)) {
    throw new Error("Can't follow this user.");
  }

  // Private accounts get a request instead; the database rejects a direct
  // follow of a private account either way.
  const { data: target } = await supabase.from("profiles").select("is_private").eq("id", followingId).maybeSingle();
  if (target?.is_private) {
    await supabase.from("follow_requests").insert({ requester_id: user.id, target_id: followingId });
  } else {
    await supabase.from("follows").insert({ follower_id: user.id, following_id: followingId });
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

  assertUuid(followingId, "user");

  // Also cancels a pending request, so one button covers Following and Requested.
  await Promise.all([
    supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", followingId),
    supabase.from("follow_requests").delete().eq("requester_id", user.id).eq("target_id", followingId),
  ]);
  revalidatePath("/people");
  revalidatePath("/profile");
  revalidatePath("/");
}

export async function acceptFollowRequest(requesterId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  assertUuid(requesterId, "user");

  const { error } = await supabase.rpc("accept_follow_request", { p_requester_id: requesterId });
  if (error) throw new Error(error.message);
  revalidatePath("/notifications");
  revalidatePath("/profile");
}

export async function declineFollowRequest(requesterId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  assertUuid(requesterId, "user");

  await supabase.from("follow_requests").delete().eq("requester_id", requesterId).eq("target_id", user.id);
  revalidatePath("/notifications");
}

export async function toggleLike(workoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workout } = await supabase.from("workouts").select("user_id").eq("id", workoutId).single();
  if (workout && workout.user_id !== user.id && (await isBlockedEitherWay(supabase, user.id, workout.user_id))) {
    throw new Error("Can't interact with this workout.");
  }

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

  const { data: workout } = await supabase.from("workouts").select("user_id").eq("id", workoutId).single();
  if (workout && workout.user_id !== user.id && (await isBlockedEitherWay(supabase, user.id, workout.user_id))) {
    throw new Error("Can't interact with this workout.");
  }

  const { error } = await supabase.from("workout_comments").insert({ workout_id: workoutId, user_id: user.id, body });
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

export async function markNotificationsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  revalidatePath("/notifications");
}
