"use client";

import { useState } from "react";
import Link from "next/link";
import type { Exercise } from "@/types/database";
import { generatePlan, type Goal, type Focus } from "@/lib/planGenerator";
import WorkoutBuilder from "@/components/WorkoutBuilder";
import { ArrowLeftIcon } from "@/components/UIIcons";

const GOALS: { value: Goal; label: string; blurb: string }[] = [
  { value: "muscle", label: "Build Muscle", blurb: "8-12 reps, more volume, more isolation work" },
  { value: "strength", label: "Build Strength", blurb: "3-6 reps, heavy compounds, longer rests" },
];

const FOCI: { value: Focus; label: string }[] = [
  { value: "full", label: "Full Body" },
  { value: "upper", label: "Upper Body" },
  { value: "lower", label: "Lower Body" },
];

export default function PlanGeneratorFlow({ exercises }: { exercises: Exercise[] }) {
  const [goal, setGoal] = useState<Goal>("muscle");
  const [focus, setFocus] = useState<Focus>("full");
  const [generated, setGenerated] = useState<ReturnType<typeof generatePlan> | null>(null);

  if (generated) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-2 px-4 pt-6">
        <button
          type="button"
          onClick={() => setGenerated(null)}
          className="flex items-center gap-1 self-start text-sm text-muted hover:text-foreground"
        >
          <ArrowLeftIcon size={16} /> Regenerate
        </button>
        <WorkoutBuilder
          exercises={exercises}
          initialTitle={generated.name}
          initialExercises={generated.exercises}
          savePlanMode
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/workouts" className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-bold">Generate a plan</h1>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">Goal</p>
        <div className="flex flex-col gap-2">
          {GOALS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGoal(g.value)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                goal === g.value ? "border-accent bg-accent/10" : "border-card-border bg-card"
              }`}
            >
              <p className="font-semibold">{g.label}</p>
              <p className="text-xs text-muted">{g.blurb}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">Focus</p>
        <div className="flex gap-2">
          {FOCI.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFocus(f.value)}
              className={`flex-1 rounded-lg border p-2.5 text-center text-sm transition-colors ${
                focus === f.value ? "border-accent bg-accent/10 text-accent" : "border-card-border bg-card text-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setGenerated(generatePlan(exercises, goal, focus))}
        className="glow-accent rounded-md bg-accent px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-accent-ink"
      >
        Generate workout
      </button>
    </div>
  );
}
