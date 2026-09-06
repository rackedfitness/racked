import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";
import { workoutVolume, formatVolume, type WorkoutLite } from "@/lib/stats";
import { ArrowLeftIcon } from "@/components/UIIcons";

type RankedProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  volume: number;
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const activeView = view === "gym" ? "gym" : "friends";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let ranked: RankedProfile[] = [];
  let gymName: string | null = null;
  let hasGym = true;

  if (activeView === "friends") {
    const { data: followingRows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user!.id);

    const ids = [...new Set([user!.id, ...(followingRows ?? []).map((f) => f.following_id)])];

    const [{ data: profiles }, { data: rawWorkouts }] = await Promise.all([
      supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", ids),
      supabase
        .from("workouts")
        .select(
          "id, title, started_at, finished_at, user_id, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup))"
        )
        .in("user_id", ids)
        .eq("is_public", true)
        .not("finished_at", "is", null)
        .gte("started_at", sevenDaysAgo.toISOString()),
    ]);

    const volumeByUser = new Map<string, number>();
    for (const w of (rawWorkouts ?? []) as unknown as (WorkoutLite & { user_id: string })[]) {
      volumeByUser.set(w.user_id, (volumeByUser.get(w.user_id) ?? 0) + workoutVolume(w));
    }

    ranked = (profiles ?? [])
      .map((p) => ({ ...p, volume: volumeByUser.get(p.id) ?? 0 }))
      .sort((a, b) => b.volume - a.volume);
  } else {
    // Gym view: use the current user's most recently tagged gym as "their"
    // gym, then rank everyone — not just people they follow, matching the
    // Feed's own public-to-everyone visibility model — who trained at that
    // same physical location. Matched by place id rather than name, since
    // two locations of the same chain can share a name.
    const { data: myLatestGymWorkout } = await supabase
      .from("workouts")
      .select("gym_place_id, gym_name")
      .eq("user_id", user!.id)
      .not("gym_place_id", "is", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (myLatestGymWorkout?.gym_place_id) {
      gymName = myLatestGymWorkout.gym_name;

      const { data: gymWorkouts } = await supabase
        .from("workouts")
        .select(
          "id, title, started_at, finished_at, user_id, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup))"
        )
        .eq("gym_place_id", myLatestGymWorkout.gym_place_id)
        .eq("is_public", true)
        .not("finished_at", "is", null)
        .gte("started_at", sevenDaysAgo.toISOString());

      const volumeByUser = new Map<string, number>();
      for (const w of (gymWorkouts ?? []) as unknown as (WorkoutLite & { user_id: string })[]) {
        volumeByUser.set(w.user_id, (volumeByUser.get(w.user_id) ?? 0) + workoutVolume(w));
      }

      const userIds = [...volumeByUser.keys()];
      if (!userIds.includes(user!.id)) userIds.push(user!.id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds);

      ranked = (profiles ?? [])
        .map((p) => ({ ...p, volume: volumeByUser.get(p.id) ?? 0 }))
        .sort((a, b) => b.volume - a.volume);
    } else {
      hasGym = false;
    }
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/feed" className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-bold">Leaderboard</h1>
      </div>

      <div className="flex gap-1 rounded-full border border-card-border bg-card p-1">
        <Link
          href="/leaderboard"
          className={`flex-1 rounded-full py-1.5 text-center text-sm font-medium transition-colors ${
            activeView === "friends" ? "bg-accent text-accent-ink" : "text-muted"
          }`}
        >
          Friends
        </Link>
        <Link
          href="/leaderboard?view=gym"
          className={`flex-1 rounded-full py-1.5 text-center text-sm font-medium transition-colors ${
            activeView === "gym" ? "bg-accent text-accent-ink" : "text-muted"
          }`}
        >
          My Gym
        </Link>
      </div>

      <p className="text-sm text-muted">
        {activeView === "friends"
          ? "Total volume this week, among people you follow."
          : gymName
            ? `Total volume this week at ${gymName}.`
            : "Total volume this week at your gym."}
      </p>

      {activeView === "gym" && !hasGym ? (
        <div className="rounded-lg border border-dashed border-card-border p-4 text-center text-sm text-muted">
          Tag a gym when you finish a workout to see who else trains there.
        </div>
      ) : (
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

          {activeView === "friends" && ranked.length === 1 && (
            <p className="text-sm text-muted">
              Follow people on the{" "}
              <Link href="/people" className="text-accent underline">
                People
              </Link>{" "}
              page to see them here.
            </p>
          )}

          {activeView === "gym" && ranked.length === 1 && (
            <p className="text-sm text-muted">
              No one else from your gym has logged a public workout this week yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
