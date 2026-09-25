"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { estimateOneRepMax } from "@/lib/stats";
import { toDisplayWeight, type WeightUnit } from "@/lib/units";

type Point = { date: string; value: number };

// A focused, single-exercise version of the "Estimated 1RM" chart on the
// Progress page — shown inline in the exercise guide modal so you don't have
// to leave what you're doing mid-workout to see whether you're improving.
// Fetches the user's own history directly (RLS-scoped) since this modal is
// opened from WorkoutBuilder, which only knows about the workout being built
// right now, not past ones.
export default function ExerciseProgressChart({ exerciseId, weightUnit }: { exerciseId: string; weightUnit: WeightUnit }) {
  const [points, setPoints] = useState<Point[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setPoints([]);
        return;
      }

      const { data } = await supabase
        .from("workouts")
        .select("started_at, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup))")
        .eq("user_id", user.id)
        .not("finished_at", "is", null)
        .order("started_at", { ascending: true });

      const result: Point[] = [];
      for (const w of data ?? []) {
        let best = 0;
        for (const we of w.workout_exercises ?? []) {
          if (we.exercise_id !== exerciseId) continue;
          for (const s of we.workout_sets ?? []) {
            if (s.is_warmup || !s.weight || !s.reps) continue;
            const est = estimateOneRepMax(s.weight, s.reps);
            if (est > best) best = est;
          }
        }
        if (best > 0) {
          result.push({
            date: new Date(w.started_at).toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
            value: Math.round(toDisplayWeight(best, weightUnit)),
          });
        }
      }
      if (!cancelled) setPoints(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [exerciseId, weightUnit]);

  if (points === null) {
    return <div className="flex h-32 items-center justify-center text-sm text-muted">Loading your history...</div>;
  }

  if (points.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-card-border p-4 text-center text-sm text-muted">
        No completed sets for this exercise yet — log some and your progress will show up here.
      </p>
    );
  }

  const delta = points[points.length - 1].value - points[0].value;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Your progress · est. 1RM ({weightUnit})</h3>
        {points.length > 1 && (
          <span className={`tnum text-xs ${delta > 0 ? "text-green-500" : delta < 0 ? "text-red-500" : "text-muted"}`}>
            {delta > 0 ? "+" : ""}
            {delta} {weightUnit} since first log
          </span>
        )}
      </div>
      <div className="tnum rounded-lg border border-card-border bg-card p-3">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={points}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
            <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} />
            <YAxis stroke="var(--muted)" fontSize={11} width={36} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--card-border)", fontSize: 12 }} />
            <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: "var(--accent)" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
