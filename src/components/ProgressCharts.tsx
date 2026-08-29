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

type VolumePoint = { date: string; volume: number };
type OneRMPoint = { date: string; value: number };

export default function ProgressCharts({
  volumeData,
  exercises,
  oneRMByExercise,
}: {
  volumeData: VolumePoint[];
  exercises: { id: string; name: string }[];
  oneRMByExercise: Record<string, OneRMPoint[]>;
}) {
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? "");
  const oneRMData = useMemo(() => oneRMByExercise[exerciseId] ?? [], [exerciseId, oneRMByExercise]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 font-semibold">Volume over time</h2>
        <div className="tnum rounded-lg border border-card-border bg-card p-3">
          {volumeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={volumeData}>
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
          <h2 className="font-semibold">Estimated 1RM</h2>
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
        <div className="tnum rounded-lg border border-card-border bg-card p-3">
          {oneRMData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={oneRMData}>
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
              Log sets for this exercise to see estimated 1RM.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
