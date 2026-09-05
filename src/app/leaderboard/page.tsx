import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import { workoutVolume, formatVolume, type WorkoutLite } from "@/lib/stats";
import { ArrowLeftIcon } from "@/components/UIIcons";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: followingRows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user!.id);

  const ids = [...new Set([user!.id, ...(followingRows ?? []).map((f) => f.following_id)])];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [{ data: profiles }, { data: rawWorkouts }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", ids),
    supabase
      .from("workouts")
      .select("id, title, started_at, finished_at, user_id, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup))")
      .in("user_id", ids)
      .eq("is_public", true)
      .not("finished_at", "is", null)
      .gte("started_at", sevenDaysAgo.toISOString()),
  ]);

  const volumeByUser = new Map<string, number>();
  for (const w of (rawWorkouts ?? []) as unknown as (WorkoutLite & { user_id: string })[]) {
    volumeByUser.set(w.user_id, (volumeByUser.get(w.user_id) ?? 0) + workoutVolume(w));
  }

  const ranked = (profiles ?? [])
    .map((p) => ({ ...p, volume: volumeByUser.get(p.id) ?? 0 }))
    .sort((a, b) => b.volume - a.volume);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/feed" className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-bold">Leaderboard</h1>
      </div>

      <p className="text-sm text-muted">Total volume this week, among people you follow.</p>

      <div className="flex flex-col gap-2">
        {ranked.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between rounded-lg border p-3 ${
              p.id === user!.id ? "border-accent bg-accent/10" : "border-card-border bg-card"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="tnum w-6 text-center text-sm text-muted">{medals[i] ?? i + 1}</span>
              <Link href={`/profile/${p.username}`} className="flex items-center gap-2">
                <Avatar url={p.avatar_url} name={p.display_name ?? p.username} size="sm" />
                <span className="text-sm font-medium">{p.display_name ?? p.username}</span>
              </Link>
            </div>
            <span className="tnum text-sm text-muted">{formatVolume(p.volume)}</span>
          </div>
        ))}

        {ranked.length === 1 && (
          <p className="text-sm text-muted">
            Follow people on the{" "}
            <Link href="/people" className="text-accent underline">
              People
            </Link>{" "}
            page to see them here.
          </p>
        )}
      </div>
    </div>
  );
}
