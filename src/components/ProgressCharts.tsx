"use client";

import { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { toDisplayWeight, type WeightUnit } from "@/lib/units";

type VolumePoint = { date: string; volume: number };
type OneRMPoint = { date: string; value: number };

type Metric = "1rm" | "weight" | "volume" | "reps";

const METRIC_LABELS: Record<Metric, string> = {
  "1rm": "Estimated 1RM",
  weight: "Highest weight",
  volume: "Volume",
  reps: "Reps",
};

export default function ProgressCharts({
  volumeData,
  exercises,
  oneRMByExercise,
  volumeByExercise,
  repsByExercise,
  bestWeightByExercise,
  weightData,
  initialExerciseId,
  weightUnit = "kg",
}: {
  volumeData: VolumePoint[];
  exercises: { id: string; name: string }[];
  oneRMByExercise: Record<string, OneRMPoint[]>;
  volumeByExercise: Record<string, OneRMPoint[]>;
  repsByExercise: Record<string, OneRMPoint[]>;
  bestWeightByExercise: Record<string, OneRMPoint[]>;
  weightData: OneRMPoint[];
  initialExerciseId?: string;
  weightUnit?: WeightUnit;
}) {
  const [exerciseId, setExerciseId] = useState(
    (initialExerciseId && oneRMByExercise[initialExerciseId] ? initialExerciseId : exercises[0]?.id) ?? ""
  );
  const [metric, setMetric] = useState<Metric>("1rm");

  const metricSource =
    metric === "1rm"
      ? oneRMByExercise
      : metric === "weight"
        ? bestWeightByExercise
        : metric === "volume"
          ? volumeByExercise
          : repsByExercise;

  // Every metric except reps arrives in kg — converted here for display
  // only, right before the chart reads it, so the underlying data (and the
  // goals progress math that shares oneRMByExercise) never has to care
  // about units.
  const exerciseMetricData = useMemo(() => {
    const points = metricSource[exerciseId] ?? [];
    return metric === "reps" ? points : points.map((p) => ({ ...p, value: toDisplayWeight(p.value, weightUnit) }));
  }, [metricSource, exerciseId, metric, weightUnit]);
  const displayVolumeData = useMemo(
    () => volumeData.map((p) => ({ ...p, volume: toDisplayWeight(p.volume, weightUnit) })),
    [volumeData, weightUnit]
  );
  const displayWeightData = useMemo(
    () => weightData.map((p) => ({ ...p, value: toDisplayWeight(p.value, weightUnit) })),
    [weightData, weightUnit]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 font-semibold">Volume over time ({weightUnit})</h2>
        <div className="tnum rounded-lg border border-card-border bg-card p-3">
          {displayVolumeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={displayVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} />
                <YAxis stroke="var(--muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--card-border)", fontSize: 12 }}
                />
                <Line type="monotone" dataKey="volume" stroke="var(--accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted">Log workouts to see volume trends.</p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">
            {METRIC_LABELS[metric]}
            {metric === "reps" ? "" : ` (${weightUnit})`}
          </h2>
          {exercises.length > 0 && (
            <select
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              className="rounded-md border border-card-border bg-card px-2 py-1 text-sm text-foreground"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="mb-2 flex gap-1 rounded-full border border-card-border bg-card p-1">
          {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`flex-1 rounded-full py-1 text-center text-xs font-medium transition-colors ${
                metric === m ? "bg-accent text-accent-ink" : "text-muted"
              }`}
            >
              {m === "1rm" ? "1RM" : m === "weight" ? "Weight" : m === "volume" ? "Volume" : "Reps"}
            </button>
          ))}
        </div>
        <div className="tnum rounded-lg border border-card-border bg-card p-3">
          {exerciseMetricData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={exerciseMetricData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} />
                <YAxis stroke="var(--muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--card-border)", fontSize: 12 }}
                />
                <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: "var(--accent)" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted">
              Log sets for this exercise to see this chart.
            </p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Bodyweight ({weightUnit})</h2>
        <div className="tnum rounded-lg border border-card-border bg-card p-3">
          {displayWeightData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={displayWeightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} />
                <YAxis stroke="var(--muted)" fontSize={11} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--card-border)", fontSize: 12 }}
                />
                <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: "var(--accent)" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted">Log your weight below to see a trend.</p>
          )}
        </div>
      </div>
    </div>
  );
}
