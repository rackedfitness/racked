import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  attachPRCounts,
  computeStreakDays,
  computeLongestStreakDays,
  nextStreakMilestone,
  formatVolume,
  workoutVolume,
  categorySetCounts,
  type WorkoutLite,
} from "@/lib/stats";
import StreakCard from "@/components/StreakCard";
import BodyMap from "@/components/BodyMap";
import Avatar from "@/components/Avatar";
import MuscleBreakdownList from "@/components/MuscleBreakdownList";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  const streakDemoMode = demo === "streak";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const bodyMapCutoff = new Date();
  bodyMapCutoff.setDate(bodyMapCutoff.getDate() - 7);

  // None of these four depend on each other, only on user.id — one round
  // trip instead of four sequential ones.
  const [{ data: profile }, { data: rawWorkouts }, { data: templates }, { data: recentWorkouts }] =
    await Promise.all([
      supabase.from("profiles").select("display_name, username, avatar_url").eq("id", user!.id).single(),
      supabase
        .from("workouts")
        .select(
          "id, title, started_at, finished_at, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup))"
        )
        .eq("user_id", user!.id)
        .not("finished_at", "is", null)
        .order("started_at", { ascending: false }),
      supabase
        .from("workout_templates")
        .select("id, name")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("workouts")
        .select("id, workout_exercises(exercises(category), workout_sets(is_warmup))")
        .eq("user_id", user!.id)
        .not("finished_at", "is", null)
        .gte("started_at", bodyMapCutoff.toISOString()),
    ]);

  const muscleCounts = categorySetCounts(recentWorkouts ?? []);
  const hasRecentMuscleData = Object.keys(muscleCounts).length > 0;

  const workouts = (rawWorkouts ?? []) as unknown as WorkoutLite[];
  const withPRs = attachPRCounts(workouts).sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );

  const totalVolume = workouts.reduce((sum, w) => sum + workoutVolume(w), 0);
  const sevenDaysAgoCutoff = new Date();
  sevenDaysAgoCutoff.setDate(sevenDaysAgoCutoff.getDate() - 7);
  const fourteenDaysAgoCutoff = new Date();
  fourteenDaysAgoCutoff.setDate(fourteenDaysAgoCutoff.getDate() - 14);
  const thisWeekCount = workouts.filter(
    (w) => new Date(w.started_at).getTime() >= sevenDaysAgoCutoff.getTime()
  ).length;
  const lastWeekCount = workouts.filter((w) => {
    const t = new Date(w.started_at).getTime();
    return t >= fourteenDaysAgoCutoff.getTime() && t < sevenDaysAgoCutoff.getTime();
  }).length;
  const weekDelta = thisWeekCount - lastWeekCount;
  const streak = computeStreakDays(workouts);
  const longestStreak = computeLongestStreakDays(workouts);
  const milestone = nextStreakMilestone(streak);
  const recent = withPRs.slice(0, 5);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar url={profile?.avatar_url} name={profile?.display_name ?? profile?.username ?? "?"} size="md" />
          <div className="min-w-0">
            <p className="text-sm text-muted">Welcome back</p>
            <h1 className="truncate text-2xl font-bold">{profile?.display_name ?? "Racked"}</h1>
          </div>
        </div>
        <Link
          href="/workout/new"
          className="glow-accent rounded-full bg-accent px-4 py-2 text-sm font-bold uppercase tracking-wide text-accent-ink"
        >
          + Start
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-card-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted">Workouts</p>
          <p className="tnum mt-1 text-2xl">{workouts.length}</p>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted">Total volume</p>
          <p className="tnum mt-1 text-2xl">{formatVolume(totalVolume)}</p>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted">This week</p>
          <p className="tnum mt-1 text-2xl">{thisWeekCount}</p>
          <p
            className={`tnum text-xs ${
              weekDelta > 0 ? "text-green-500" : weekDelta < 0 ? "text-red-500" : "text-muted"
            }`}
          >
            {weekDelta > 0 ? `+${weekDelta}` : weekDelta}
          </p>
        </div>
      </div>

      <StreakCard
        streak={streak}
        longestStreak={longestStreak}
        milestone={milestone}
        demoMode={streakDemoMode}
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">This week&rsquo;s muscles</h2>
          <Link href="/history/body-map" className="text-sm text-accent">
            Full map
          </Link>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-4">
          {hasRecentMuscleData ? (
            <div className="flex flex-wrap items-start gap-4">
              <BodyMap counts={muscleCounts} compact size={150} showLabels={false} />
              <MuscleBreakdownList counts={muscleCounts} />
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted">
              No workouts logged in the last 7 days.
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Your plans</h2>
          <Link href="/workouts" className="text-sm text-accent">
            See all
          </Link>
        </div>
        {templates && templates.length > 0 ? (
          <div className="flex flex-col gap-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-card-border bg-card p-3"
              >
                <span className="font-medium">{t.name}</span>
                <Link
                  href={`/workout/new?template=${t.id}`}
                  className="glow-accent-sm shrink-0 rounded-full bg-accent px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-accent-ink active:opacity-80"
                >
                  ▶ Start
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <Link
            href="/workouts"
            className="flex items-center justify-center rounded-lg border border-dashed border-card-border p-6 text-sm text-muted active:border-accent"
          >
            Build your first workout plan
          </Link>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Recent sessions</h2>
          <Link href="/history" className="text-sm text-accent">
            History
          </Link>
        </div>
        {recent.length === 0 && (
          <p className="text-sm text-muted">No workouts yet. Hit Start to log your first one.</p>
        )}
        <div className="flex flex-col gap-2">
          {recent.map((w) => (
            <Link
              key={w.id}
              href={`/workout/${w.id}`}
              className="flex items-center justify-between rounded-lg border border-card-border bg-card p-3 hover:border-accent"
            >
              <div>
                <p className="font-medium">{w.title}</p>
                <p className="text-xs text-muted">
                  {new Date(w.started_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="tnum text-muted">{formatVolume(w.volume)}</span>
                {w.prCount > 0 && (
                  <span className="tnum rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                    🏆 {w.prCount} PR{w.prCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
