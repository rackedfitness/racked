"use client";

import { useState } from "react";
import { addGoal, deleteGoal } from "@/app/progress/goalActions";
import SubmitButton from "@/components/SubmitButton";
import { CloseIcon } from "@/components/UIIcons";

type Goal = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  targetWeightKg: number;
  targetDate: string | null;
  currentBestKg: number;
};

export default function GoalsSection({
  goals,
  exercises,
}: {
  goals: Goal[];
  exercises: { id: string; name: string }[];
}) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">Goals</h2>
        <button type="button" onClick={() => setFormOpen((v) => !v)} className="text-sm text-accent">
          {formOpen ? "Cancel" : "+ Add goal"}
        </button>
      </div>

      {formOpen && (
        <form
          action={async (formData) => {
            await addGoal(formData);
            setFormOpen(false);
          }}
          className="mb-3 flex flex-col gap-2 rounded-lg border border-card-border bg-card p-3"
        >
          <select
            name="exerciseId"
            required
            defaultValue=""
            className="rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="" disabled>
              Choose an exercise
            </option>
            {exercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              name="targetWeightKg"
              type="number"
              step="0.5"
              min="0"
              required
              placeholder="Target (kg)"
              className="flex-1 rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
            />
            <input
              name="targetDate"
              type="date"
              className="tnum flex-1 rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <SubmitButton className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-ink">
            Set goal
          </SubmitButton>
        </form>
      )}

      {goals.length === 0 ? (
        <p className="text-sm text-muted">No goals set yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentBestKg / g.targetWeightKg) * 100));
            const achieved = g.currentBestKg >= g.targetWeightKg;
            return (
              <div key={g.id} className="rounded-lg border border-card-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{g.exerciseName}</p>
                    <p className="tnum text-xs text-muted">
                      {g.currentBestKg}kg / {g.targetWeightKg}kg
                      {g.targetDate && ` · by ${new Date(g.targetDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <form action={deleteGoal.bind(null, g.id)}>
                    <SubmitButton className="text-muted active:text-red-400">
                      <CloseIcon size={14} />
                    </SubmitButton>
                  </form>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
                  <div
                    className={`h-full rounded-full ${achieved ? "bg-accent" : "bg-accent/60"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {achieved && <p className="mt-1 text-xs font-semibold text-accent">🎉 Goal reached!</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
