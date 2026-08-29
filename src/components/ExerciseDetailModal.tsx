"use client";

import ExerciseIcon, { equipmentLabel } from "@/components/ExerciseIcon";
import { EXERCISE_GUIDES } from "@/lib/exerciseGuides";
import { getPose } from "@/components/ExercisePoseIcons";
import { CloseIcon, ArrowRightIcon } from "@/components/UIIcons";

const CATEGORY_LABELS: Record<string, string> = {
  chest: "Chest",
  back: "Back",
  legs: "Legs",
  shoulders: "Shoulders",
  arms: "Arms",
  core: "Core",
  cardio: "Cardio",
};

export default function ExerciseDetailModal({
  name,
  category,
  equipment,
  onClose,
}: {
  name: string;
  category: string | null;
  equipment: string | null;
  onClose: () => void;
}) {
  const guide = EXERCISE_GUIDES[name];
  const pose = getPose(name);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <div
        className="flex items-center gap-2 border-b border-card-border p-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <h2 className="flex-1 truncate font-semibold">Exercise guide</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-muted active:text-foreground"
        >
          <CloseIcon size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="mb-5 flex items-center gap-3">
          <ExerciseIcon equipment={equipment} size={48} />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{name}</h1>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {category && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                  {CATEGORY_LABELS[category] ?? category}
                </span>
              )}
              {equipmentLabel(equipment) && (
                <span className="rounded-full border border-card-border px-2 py-0.5 text-xs text-muted">
                  {equipmentLabel(equipment)}
                </span>
              )}
            </div>
          </div>
        </div>

        {equipment === "dumbbell" && (
          <p className="mb-5 rounded-lg border border-card-border bg-card p-3 text-sm text-muted">
            Log the weight of a single dumbbell here, not the combined total of both — a 20kg set means two 20kg
            dumbbells.
          </p>
        )}

        {pose && (
          <div className="mb-5 flex items-center justify-center gap-5 rounded-lg border border-card-border bg-card py-4">
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-32 w-32 text-foreground">{pose.start}</div>
              <span className="text-xs uppercase tracking-wide text-muted">Start</span>
            </div>
            <ArrowRightIcon size={20} className="text-muted" />
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-32 w-32 text-foreground">{pose.end}</div>
              <span className="text-xs uppercase tracking-wide text-muted">Finish</span>
            </div>
          </div>
        )}

        {guide ? (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">How to do it</h3>
              <ol className="flex flex-col gap-2.5">
                {guide.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {guide.tips && guide.tips.length > 0 && (
              <div className="rounded-lg border border-card-border bg-card p-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Tips</h3>
                <ul className="flex flex-col gap-1.5">
                  {guide.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted">
                      <span className="text-accent">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-card-border p-4 text-center text-sm text-muted">
            No guide written yet for this exercise.
          </p>
        )}
      </div>
    </div>
  );
}
