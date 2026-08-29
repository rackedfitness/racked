import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { attachPRCounts, computePREvents, formatVolume, type WorkoutLite } from "@/lib/stats";
import { computeLiftRank, liftKeyForExerciseName, type Sex } from "@/lib/rankSystem";
import RankBadge from "@/components/RankBadge";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const activeView = view === "prs" ? "prs" : "workouts";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rawWorkouts } = await supabase
    .from("workouts")
    .select(
      "id, title, notes, started_at, finished_at, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup))"
    )
    .eq("user_id", user!.id)
    .not("finished_at", "is", null)
    .order("started_at", { ascending: false });

  const workouts = (rawWorkouts ?? []) as unknown as WorkoutLite[];
  const withPRs = attachPRCounts(workouts).sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );

  let rankedPREvents: Array<{
    exerciseName: string;
    weight: number;
    reps: number;
    startedAt: string;
    percentile: number;
    rank: ReturnType<typeof computeLiftRank>["rank"];
  }> = [];
  let canRank = false;

  if (activeView === "prs") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("sex, age")
      .eq("id", user!.id)
      .single();

    const { data: latestMeasurement } = await supabase
      .from("body_measurements")
      .select("weight_kg")
      .eq("user_id", user!.id)
      .not("weight_kg", "is", null)
      .order("logged_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: exercises } = await supabase.from("exercises").select("id, name");
    const exerciseNames = Object.fromEntries((exercises ?? []).map((e) => [e.id, e.name]));

    canRank = Boolean(latestMeasurement?.weight_kg && profile?.age && profile?.sex);

    const allEvents = computePREvents(workouts);
    rankedPREvents = allEvents
      .map((ev) => {
        const name = exerciseNames[ev.exerciseId];
        const lift = name ? liftKeyForExerciseName(name) : null;
        if (!lift || !canRank) return null;
        const { percentile, rank } = computeLiftRank({
          lift,
          oneRepMaxKg: ev.est1RM,
          bodyweightKg: latestMeasurement!.weight_kg!,
          age: profile!.age!,
          sex: profile!.sex as Sex,
        });
        return { exerciseName: name, weight: ev.weight, reps: ev.reps, startedAt: ev.startedAt, percentile, rank };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">History</h1>
        <Link
          href="/history/body-map"
          className="rounded-full border border-card-border px-3 py-1.5 text-sm text-foreground"
        >
          Body map
        </Link>
      </div>

      <div className="flex gap-1 rounded-full border border-card-border bg-card p-1">
        <Link
          href="/history"
          className={`flex-1 rounded-full py-1.5 text-center text-sm font-medium transition-colors ${
            activeView === "workouts" ? "bg-accent text-accent-ink" : "text-muted"
          }`}
        >
          Workouts
        </Link>
        <Link
          href="/history?view=prs"
          className={`flex-1 rounded-full py-1.5 text-center text-sm font-medium transition-colors ${
            activeView === "prs" ? "bg-accent text-accent-ink" : "text-muted"
          }`}
        >
          PRs
        </Link>
      </div>

      {activeView === "workouts" ? (
        <div className="flex flex-col gap-2">
          {withPRs.map((w) => {
            const durationMin = w.finished_at
              ? Math.max(
                  0,
                  Math.round(
                    (new Date(w.finished_at).getTime() - new Date(w.started_at).getTime()) / 60000
                  )
                )
              : 0;

            return (
              <Link
                key={w.id}
                href={`/workout/${w.id}`}
                className="flex items-center justify-between rounded-lg border border-card-border bg-card p-3 hover:border-accent"
              >
                <div className="min-w-0">
                  <p className="font-medium">{w.title}</p>
                  <p className="text-xs text-muted">
                    {new Date(w.started_at).toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  {w.notes && (
                    <p className="mt-0.5 truncate text-xs italic text-muted">&ldquo;{w.notes}&rdquo;</p>
                  )}
                </div>
                <div className="tnum flex items-center gap-2 text-sm text-muted">
                  <span>{formatVolume(w.volume)}</span>
                  <span>{durationMin} min</span>
                  {w.prCount > 0 && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                      🏆 {w.prCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {withPRs.length === 0 && <p className="text-sm text-muted">No workouts logged yet.</p>}
        </div>
      ) : !canRank ? (
        <div className="rounded-lg border border-dashed border-card-border p-4 text-center text-sm text-muted">
          Add your sex and age in{" "}
          <Link href="/settings" className="text-accent underline">
            Settings
          </Link>{" "}
          and log your bodyweight in{" "}
          <Link href="/progress" className="text-accent underline">
            Progress
          </Link>{" "}
          to see ranks on your PRs.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rankedPREvents.map((ev, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-card-border bg-card p-3"
            >
              <div>
                <p className="font-medium">{ev.exerciseName}</p>
                <p className="text-xs text-muted">
                  {new Date(ev.startedAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="tnum text-sm">
                  {ev.weight}kg × {ev.reps}
                </span>
                <RankBadge rank={ev.rank} size="sm" />
              </div>
            </div>
          ))}

          {rankedPREvents.length === 0 && (
            <p className="text-sm text-muted">
              No ranked PRs yet — log a bench press, squat, deadlift, or overhead press.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
