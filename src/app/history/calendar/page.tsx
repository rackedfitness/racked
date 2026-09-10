import Link from "next/link";
import { createClient, getWeightUnit } from "@/lib/supabase/server";
import { workoutVolume, formatVolume, type WorkoutLite } from "@/lib/stats";
import { ArrowLeftIcon } from "@/components/UIIcons";

const CELL = 12;
const GAP = 3;
const WEEKS_TO_SHOW = 26;

function levelFor(volume: number, maxVolume: number): number {
  if (volume <= 0) return 0;
  const ratio = volume / maxVolume;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

const LEVEL_COLORS = [
  "var(--card-border)",
  "color-mix(in srgb, var(--accent) 25%, var(--card))",
  "color-mix(in srgb, var(--accent) 50%, var(--card))",
  "color-mix(in srgb, var(--accent) 75%, var(--card))",
  "var(--accent)",
];

export default async function TrainingCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const weightUnit = await getWeightUnit();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (WEEKS_TO_SHOW * 7 - 1));
  start.setDate(start.getDate() - start.getDay()); // align to the preceding Sunday

  // Bounded to the visible window — without this, the query pulls a
  // workout's entire history (with nested set joins) just to shade a
  // 26-week grid, and only gets more wasteful the longer the account exists.
  const { data: rawWorkouts } = await supabase
    .from("workouts")
    .select(
      "id, started_at, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup))"
    )
    .eq("user_id", user!.id)
    .not("finished_at", "is", null)
    .gte("started_at", start.toISOString());

  const workouts = (rawWorkouts ?? []) as unknown as WorkoutLite[];

  const volumeByDate = new Map<string, number>();
  for (const w of workouts) {
    const key = new Date(w.started_at).toDateString();
    volumeByDate.set(key, (volumeByDate.get(key) ?? 0) + workoutVolume(w));
  }

  const days: { date: Date; volume: number }[] = [];
  for (const cursor = new Date(start); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
    days.push({ date: new Date(cursor), volume: volumeByDate.get(cursor.toDateString()) ?? 0 });
  }
  while (days.length % 7 !== 0) {
    const next = new Date(days[days.length - 1].date);
    next.setDate(next.getDate() + 1);
    days.push({ date: next, volume: 0 });
  }

  const weeks: { date: Date; volume: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const maxVolume = Math.max(1, ...days.map((d) => d.volume));
  const activeDayCount = days.filter((d) => d.volume > 0).length;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/history" className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-bold">Training calendar</h1>
      </div>

      <p className="text-sm text-muted">
        {activeDayCount} training day{activeDayCount === 1 ? "" : "s"} in the last {WEEKS_TO_SHOW} weeks.
      </p>

      <div className="overflow-x-auto rounded-lg border border-card-border bg-card p-4">
        <div className="flex" style={{ gap: GAP }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
              {week.map((day, di) => {
                const isFuture = day.date > today;
                return (
                  <div
                    key={di}
                    title={`${day.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}${day.volume > 0 ? ` — ${formatVolume(day.volume, weightUnit)} volume` : ""}`}
                    className="rounded-[2px]"
                    style={{
                      width: CELL,
                      height: CELL,
                      backgroundColor: isFuture ? "transparent" : LEVEL_COLORS[levelFor(day.volume, maxVolume)],
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 text-xs text-muted">
        <span>Less</span>
        {LEVEL_COLORS.map((color, i) => (
          <div key={i} className="rounded-[2px]" style={{ width: CELL, height: CELL, backgroundColor: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
