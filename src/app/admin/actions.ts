"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { attachPRCounts, type WorkoutLite } from "@/lib/stats";

export type ReportRow = {
  id: string;
  reporter_username: string | null;
  reported_username: string | null;
  workout_id: string | null;
  workout_title: string | null;
  comment_id: string | null;
  comment_body: string | null;
  reason: string;
  status: "open" | "reviewed" | "dismissed";
  created_at: string;
};

// Admin = is_admin flag AND a two-factor (aal2) session, checked inside
// Postgres from the verified JWT (is_admin_with_mfa). Every admin RPC
// re-checks the same thing itself; this gate matters most for
// backfillPrCounts, which uses the service-role client and so has no
// database-side check of its own.
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ok } = await supabase.rpc("is_admin_with_mfa");
  if (ok !== true) throw new Error("Not authorized");

  return supabase;
}

export async function getReports(): Promise<ReportRow[]> {
  const supabase = await requireAdmin();
  const { data, error } = await supabase.rpc("admin_list_reports");
  if (error) throw new Error(error.message);
  return (data ?? []) as ReportRow[];
}

export async function updateReportStatus(reportId: string, status: "reviewed" | "dismissed") {
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_update_report_status", { p_report_id: reportId, p_status: status });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function adminDeleteWorkout(workoutId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_delete_workout", { p_workout_id: workoutId });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/feed");
}

export async function adminDeleteComment(commentId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_delete_comment", { p_comment_id: commentId });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// One-time (or re-runnable) backfill for workouts.pr_count on rows saved
// before that column existed — new workouts get it written directly by
// saveWorkout, so this only ever needs to touch the legacy backlog.
export async function backfillPrCounts(): Promise<{ updated: number }> {
  await requireAdmin();

  const adminClient = createServiceRoleClient();
  const { data: allWorkouts, error } = await adminClient
    .from("workouts")
    .select(
      "id, user_id, title, started_at, finished_at, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup))"
    )
    .not("finished_at", "is", null);
  if (error) throw new Error(error.message);

  const byUser = new Map<string, (WorkoutLite & { user_id: string })[]>();
  for (const w of (allWorkouts ?? []) as unknown as (WorkoutLite & { user_id: string })[]) {
    const list = byUser.get(w.user_id) ?? [];
    list.push(w);
    byUser.set(w.user_id, list);
  }

  const updates: { id: string; pr_count: number }[] = [];
  for (const userWorkouts of byUser.values()) {
    for (const w of attachPRCounts(userWorkouts)) {
      updates.push({ id: w.id, pr_count: w.prCount });
    }
  }

  if (updates.length > 0) {
    const { error: upsertError } = await adminClient.from("workouts").upsert(updates, { onConflict: "id" });
    if (upsertError) throw new Error(upsertError.message);
  }

  revalidatePath("/feed");
  return { updated: updates.length };
}
