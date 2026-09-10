"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function blockUser(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (userId === user.id) return;

  await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: userId });
  // A block should also end any existing follow relationship in either
  // direction — otherwise a blocked user's workouts could still surface via
  // "people you follow"-scoped views.
  await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
  await supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", user.id);

  revalidatePath("/feed");
  revalidatePath("/profile/[username]", "page");
}

export async function unblockUser(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", userId);

  revalidatePath("/feed");
  revalidatePath("/profile/[username]", "page");
}

export async function reportContent(input: {
  reportedUserId?: string;
  workoutId?: string;
  commentId?: string;
  reason: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const reason = input.reason.trim();
  if (!reason) throw new Error("Add a reason for the report.");

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_user_id: input.reportedUserId ?? null,
    workout_id: input.workoutId ?? null,
    comment_id: input.commentId ?? null,
    reason,
  });
  if (error) throw new Error(error.message);
}

// Union of "people I've blocked" and "people who've blocked me" — used to
// filter both directions out of anything the current user sees, so blocking
// someone also stops their content from reaching you even though only one
// side performed the block.
export async function getMutualBlockedIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const [{ data: blockedByMe }, { data: blockedMe }] = await Promise.all([
    supabase.from("blocks").select("blocked_id").eq("blocker_id", userId),
    supabase.from("blocks").select("blocker_id").eq("blocked_id", userId),
  ]);
  return [
    ...new Set([
      ...(blockedByMe ?? []).map((b) => b.blocked_id),
      ...(blockedMe ?? []).map((b) => b.blocker_id),
    ]),
  ];
}
