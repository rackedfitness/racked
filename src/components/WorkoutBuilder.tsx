"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Exercise } from "@/types/database";
import { saveWorkout, saveTemplate, type ExerciseInput, type SetInput } from "@/app/workout/actions";
import { estimateOneRepMax, formatDuration } from "@/lib/stats";
import { playTapSound, playPRSound } from "@/lib/sound";
import { createClient } from "@/lib/supabase/client";
import confetti from "canvas-confetti";
import ExercisePicker from "@/components/ExercisePicker";
import ExerciseIcon, { equipmentLabel } from "@/components/ExerciseIcon";
import ExerciseDetailModal from "@/components/ExerciseDetailModal";
import BodyMap from "@/components/BodyMap";
import { MenuDotsIcon, CheckIcon, CloseIcon } from "@/components/UIIcons";

type BuilderSet = SetInput & { isPR?: boolean };

type BuilderExercise = {
  exerciseId: string;
  name: string;
  equipment: string | null;
  category: string | null;
  sets: BuilderSet[];
};

type InitialExercise = {
  exerciseId: string;
  name: string;
  equipment: string | null;
  category: string | null;
  targetSets: number;
  targetReps: number | null;
};

// A simple medal glyph (ribbon flags + disc) for PR-celebration confetti.
// canvas-confetti's shapeFromPath needs a browser Path2D, so it's built lazily
// on first use (never at module scope, which would also run during SSR) and
// cached since computing the transform matrix is relatively expensive.
const MEDAL_PATH =
  "M14,2 L20,2 L20,14 Z M26,2 L20,2 L20,14 Z M11,24 A9,9 0 1,0 29,24 A9,9 0 1,0 11,24 Z";
let medalShapeCache: ReturnType<typeof confetti.shapeFromPath> | null = null;
function getMedalShape() {
  if (!medalShapeCache) {
    medalShapeCache = confetti.shapeFromPath({ path: MEDAL_PATH });
  }
  return medalShapeCache;
}

function fireConfetti() {
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ccff00";
  confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 45,
    origin: { y: 0.6 },
    colors: [accent, "#ffffff"],
    ticks: 160,
    shapes: [getMedalShape()],
  });
}

function suggestedWeightFor(
  sets: BuilderSet[],
  upToIndex: number,
  historical: number | undefined
): number | null {
  for (let i = upToIndex - 1; i >= 0; i--) {
    if (sets[i].weight != null) return sets[i].weight;
  }
  return historical ?? null;
}

// The actual load lifted for stats/PR purposes. Bodyweight exercises use the
// user's logged bodyweight directly (no weight input at all); weighted
// bodyweight exercises add the logged "added weight" input on top of it.
function effectiveSetWeight(
  equipment: string | null | undefined,
  rawWeight: number | null,
  bodyweightKg: number | null
): number | null {
  if (equipment === "bodyweight") return bodyweightKg;
  if (equipment === "weighted_bodyweight") {
    return bodyweightKg != null ? bodyweightKg + (rawWeight ?? 0) : rawWeight;
  }
  return rawWeight;
}

export default function WorkoutBuilder({
  exercises,
  initialTitle = "Workout",
  initialExercises = [],
  savePlanMode = false,
  bestEver = {},
  lastKnownWeight = {},
  bodyweightKg = null,
  userId,
}: {
  exercises: Exercise[];
  initialTitle?: string;
  initialExercises?: InitialExercise[];
  savePlanMode?: boolean;
  bestEver?: Record<string, number>;
  lastKnownWeight?: Record<string, number>;
  bodyweightKg?: number | null;
  userId?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [startedAt] = useState(() => new Date().toISOString());
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<BuilderExercise[]>(() =>
    initialExercises.map((ie) => ({
      exerciseId: ie.exerciseId,
      name: ie.name,
      equipment: ie.equipment,
      category: ie.category,
      sets: Array.from({ length: ie.targetSets }, () => ({
        weight: null,
        reps: ie.targetReps,
        distanceKm: null,
        durationSeconds: null,
        isWarmup: false,
        completed: false,
      })),
    }))
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [detailExerciseId, setDetailExerciseId] = useState<string | null>(null);
  const [finishChoiceOpen, setFinishChoiceOpen] = useState(false);

  useEffect(() => {
    if (savePlanMode) return;
    const interval = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [savePlanMode]);

  const elapsedSeconds = Math.max(0, Math.floor((nowTs - new Date(startedAt).getTime()) / 1000));

  function addExercise(exercise: Exercise) {
    setSelected((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        name: exercise.name,
        equipment: exercise.equipment,
        category: exercise.category,
        sets: [],
      },
    ]);
  }

  const sessionCounts: Record<string, number> = {};
  for (const ex of selected) {
    if (!ex.category) continue;
    const workingSets = ex.sets.filter((s) => s.completed && !s.isWarmup).length;
    if (workingSets > 0) sessionCounts[ex.category] = (sessionCounts[ex.category] ?? 0) + workingSets;
  }
  const hasSessionActivity = Object.keys(sessionCounts).length > 0;

  function removeExercise(exerciseId: string) {
    setSelected((prev) => prev.filter((e) => e.exerciseId !== exerciseId));
  }

  function addSet(exerciseId: string) {
    setSelected((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? {
              ...e,
              sets: [
                ...e.sets,
                {
                  weight: null,
                  reps: null,
                  distanceKm: null,
                  durationSeconds: null,
                  isWarmup: false,
                  completed: false,
                },
              ],
            }
          : e
      )
    );
  }

  function updateSet(exerciseId: string, index: number, patch: Partial<BuilderSet>) {
    setSelected((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, sets: e.sets.map((s, i) => (i === index ? { ...s, ...patch } : s)) }
          : e
      )
    );
  }

  // Re-derives which single set (if any) is this exercise's PR: the highest
  // estimated 1RM among completed sets, but only if it beats the all-time
  // prior best. Only ever one set per exercise carries the badge — if a
  // later set beats an earlier "PR" set, the earlier badge is cleared.
  function recomputeExercisePRs(
    sets: BuilderSet[],
    priorBest: number,
    equipment: string | null
  ): { sets: BuilderSet[]; bestIndex: number | null } {
    let bestIndex: number | null = null;
    let bestEst1RM = priorBest;
    sets.forEach((s, i) => {
      const weight = effectiveSetWeight(equipment, s.weight, bodyweightKg);
      if (s.completed && weight && s.reps) {
        const est1RM = estimateOneRepMax(weight, s.reps);
        if (est1RM > bestEst1RM) {
          bestEst1RM = est1RM;
          bestIndex = i;
        }
      }
    });
    return { sets: sets.map((s, i) => ({ ...s, isPR: i === bestIndex })), bestIndex };
  }

  function toggleSetComplete(exerciseId: string, idx: number) {
    const ex = selected.find((e) => e.exerciseId === exerciseId);
    if (!ex) return;
    const set = ex.sets[idx];
    const willComplete = !set.completed;

    // No weight input at all for bodyweight exercises, and cardio sets never
    // populate weight either — skip the auto-fill-from-history step for both.
    // For weighted bodyweight, only use in-session suggestions (this session's
    // own "added weight" values); lastKnownWeight holds historical TOTAL
    // weight (bodyweight + added), which would wildly overstate a suggestion.
    const hasWeightInput = ex.equipment !== "bodyweight" && ex.category !== "cardio";
    const historicalFallback = ex.equipment === "weighted_bodyweight" ? undefined : lastKnownWeight[exerciseId];
    const effectiveWeight =
      willComplete && hasWeightInput
        ? (set.weight ?? suggestedWeightFor(ex.sets, idx, historicalFallback))
        : set.weight;

    const toggledSets = ex.sets.map((s, i) =>
      i === idx ? { ...s, completed: willComplete, weight: effectiveWeight } : s
    );

    const priorBest = bestEver[exerciseId] ?? 0;
    const { sets: finalSets, bestIndex } = recomputeExercisePRs(toggledSets, priorBest, ex.equipment);

    setSelected((prev) => prev.map((e) => (e.exerciseId === exerciseId ? { ...e, sets: finalSets } : e)));

    if (willComplete && bestIndex === idx) {
      playPRSound();
      fireConfetti();
    } else if (willComplete) {
      playTapSound();
    }
  }

  function removeSet(exerciseId: string, index: number) {
    setSelected((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId ? { ...e, sets: e.sets.filter((_, i) => i !== index) } : e
      )
    );
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError("Image must be under 8MB.");
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleFinish(isPublic: boolean) {
    setError(null);
    setFinishChoiceOpen(false);

    startTransition(async () => {
      try {
        let photoUrl: string | null = null;
        if (photoFile && userId) {
          const supabase = createClient();
          const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `${userId}/${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("workout-photos")
            .upload(path, photoFile, { cacheControl: "3600" });
          if (uploadError) throw new Error(uploadError.message);
          photoUrl = supabase.storage.from("workout-photos").getPublicUrl(path).data.publicUrl;
        }

        const payload: ExerciseInput[] = selected.map((e) => ({
          exerciseId: e.exerciseId,
          sets: e.sets.map((s) => ({
            ...s,
            weight: effectiveSetWeight(e.equipment, s.weight, bodyweightKg),
          })),
        }));
        await saveWorkout({
          title,
          notes: notes.trim() || null,
          exercises: payload,
          isPublic,
          photoUrl,
          startedAt,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleSavePlan() {
    setError(null);
    const payload = selected.map((e) => ({
      exerciseId: e.exerciseId,
      targetSets: e.sets.length,
      targetReps: e.sets.find((s) => s.reps)?.reps ?? null,
    }));

    startTransition(async () => {
      try {
        await saveTemplate({ name: title, exercises: payload });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-w-0 flex-1 text-xl font-bold outline-none"
          placeholder={savePlanMode ? "Plan name" : "Workout title"}
        />
        <button
          type="button"
          disabled={isPending || selected.length === 0}
          onClick={savePlanMode ? handleSavePlan : () => setFinishChoiceOpen(true)}
          className="glow-accent shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-accent-ink disabled:opacity-50 disabled:shadow-none"
        >
          {isPending ? "Saving..." : savePlanMode ? "Save" : "Finish"}
        </button>
      </div>

      {!savePlanMode && <p className="tnum text-sm text-muted">{formatDuration(elapsedSeconds)}</p>}

      {pickerOpen && (
        <ExercisePicker
          exercises={exercises}
          excludeIds={selected.map((s) => s.exerciseId)}
          onAdd={addExercise}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {detailExerciseId &&
        (() => {
          const detailEx = selected.find((e) => e.exerciseId === detailExerciseId);
          if (!detailEx) return null;
          return (
            <ExerciseDetailModal
              name={detailEx.name}
              category={detailEx.category}
              equipment={detailEx.equipment}
              onClose={() => setDetailExerciseId(null)}
            />
          );
        })()}

      <div className="flex flex-col gap-6">
        {selected.map((ex) => (
          <div key={ex.exerciseId} className="rounded-lg border border-card-border bg-card p-3">
            <div className="relative mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setDetailExerciseId(ex.exerciseId)}
                className="flex min-w-0 items-center gap-2 text-left active:opacity-70"
              >
                <ExerciseIcon equipment={ex.equipment} />
                <h3 className="truncate font-semibold text-accent underline decoration-accent/40 underline-offset-2">
                  {ex.name}
                  {equipmentLabel(ex.equipment) && (
                    <span className="text-foreground no-underline"> ({equipmentLabel(ex.equipment)})</span>
                  )}
                </h3>
              </button>
              <button
                type="button"
                onClick={() => setOpenMenuId((id) => (id === ex.exerciseId ? null : ex.exerciseId))}
                aria-label="Exercise options"
                aria-haspopup="menu"
                aria-expanded={openMenuId === ex.exerciseId}
                className="-m-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted active:text-foreground"
              >
                <MenuDotsIcon size={18} />
              </button>
              {openMenuId === ex.exerciseId && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                  <div className="absolute right-0 top-9 z-20 min-w-[9rem] overflow-hidden rounded-md border border-card-border bg-card shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuId(null);
                        removeExercise(ex.exerciseId);
                      }}
                      className="block w-full px-3 py-2.5 text-left text-sm text-red-400 active:bg-red-400/10"
                    >
                      Remove exercise
                    </button>
                  </div>
                </>
              )}
            </div>

            {ex.sets.length > 0 && (
              <div className="mb-2 grid grid-cols-[1.25rem_1fr_1fr_2.5rem_2.25rem] items-center gap-2 px-1 text-xs text-muted">
                <span>Set</span>
                {ex.category === "cardio" ? (
                  <>
                    <span>Distance</span>
                    <span>Time</span>
                  </>
                ) : ex.equipment === "bodyweight" ? (
                  <>
                    <span>Bodyweight</span>
                    <span>Reps</span>
                  </>
                ) : (
                  <>
                    <span>{ex.equipment === "weighted_bodyweight" ? "Added" : "Weight"}</span>
                    <span>Reps</span>
                  </>
                )}
                <span></span>
                <span></span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {ex.sets.map((set, idx) => {
                const suggested = suggestedWeightFor(ex.sets, idx, lastKnownWeight[ex.exerciseId]);
                return (
                <div key={idx} className="relative">
                  {set.isPR && (
                    <span className="tnum absolute -top-2 right-8 z-10 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-ink">
                      PR
                    </span>
                  )}
                  <div
                    className={`grid grid-cols-[1.25rem_1fr_1fr_2.5rem_2.25rem] items-center gap-2 rounded-md border p-1 transition-colors duration-300 ${
                      set.isPR
                        ? "animate-pr-pop border-accent bg-accent/20"
                        : set.completed
                          ? "animate-set-complete border-accent bg-accent/15"
                          : "border-transparent"
                    }`}
                  >
                    <span className="tnum text-sm text-muted">{idx + 1}</span>
                    {ex.category === "cardio" ? (
                      <>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={set.distanceKm ?? ""}
                          onChange={(e) =>
                            updateSet(ex.exerciseId, idx, {
                              distanceKm: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          placeholder="km"
                          className="tnum w-full min-w-0 rounded-md border border-card-border bg-background px-2 py-2 text-foreground placeholder:font-sans placeholder:font-normal placeholder:text-muted"
                        />
                        <input
                          type="number"
                          inputMode="decimal"
                          value={set.durationSeconds != null ? set.durationSeconds / 60 : ""}
                          onChange={(e) =>
                            updateSet(ex.exerciseId, idx, {
                              durationSeconds: e.target.value === "" ? null : Math.round(Number(e.target.value) * 60),
                            })
                          }
                          placeholder="min"
                          className="tnum w-full min-w-0 rounded-md border border-card-border bg-background px-2 py-2 text-foreground placeholder:font-sans placeholder:font-normal placeholder:text-muted"
                        />
                      </>
                    ) : ex.equipment === "bodyweight" ? (
                      <>
                        <span className="tnum flex w-full min-w-0 items-center justify-center rounded-md border border-card-border bg-background px-2 py-2 text-muted">
                          {bodyweightKg != null ? `${bodyweightKg}kg` : "BW"}
                        </span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={set.reps ?? ""}
                          onChange={(e) =>
                            updateSet(ex.exerciseId, idx, {
                              reps: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          placeholder="reps"
                          className="tnum w-full min-w-0 rounded-md border border-card-border bg-background px-2 py-2 text-foreground placeholder:font-sans placeholder:font-normal placeholder:text-muted"
                        />
                      </>
                    ) : (
                      <>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={set.weight ?? ""}
                          onChange={(e) =>
                            updateSet(ex.exerciseId, idx, {
                              weight: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          placeholder={
                            ex.equipment === "weighted_bodyweight"
                              ? "+kg"
                              : suggested != null
                                ? String(suggested)
                                : "kg"
                          }
                          className="tnum w-full min-w-0 rounded-md border border-card-border bg-background px-2 py-2 text-foreground placeholder:font-sans placeholder:font-normal placeholder:text-muted"
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          value={set.reps ?? ""}
                          onChange={(e) =>
                            updateSet(ex.exerciseId, idx, {
                              reps: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          placeholder="reps"
                          className="tnum w-full min-w-0 rounded-md border border-card-border bg-background px-2 py-2 text-foreground placeholder:font-sans placeholder:font-normal placeholder:text-muted"
                        />
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleSetComplete(ex.exerciseId, idx)}
                      aria-label={set.completed ? "Mark set incomplete" : "Mark set complete"}
                      aria-pressed={set.completed}
                      className={`flex h-10 w-10 items-center justify-center justify-self-center rounded-md border-2 transition-colors duration-200 active:scale-95 ${
                        set.completed
                          ? "border-accent bg-accent text-accent-ink"
                          : "border-card-border bg-background text-transparent"
                      }`}
                    >
                      <span className={set.completed ? "animate-check-pop" : ""}>
                        <CheckIcon size={18} />
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSet(ex.exerciseId, idx)}
                      aria-label="Remove set"
                      className="flex h-10 w-9 items-center justify-center justify-self-center text-muted active:text-red-400"
                    >
                      <CloseIcon size={15} />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => addSet(ex.exerciseId)}
              className="mt-2 w-full rounded-md border border-dashed border-card-border py-2.5 text-sm text-muted active:border-accent"
            >
              + Add set
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="w-full rounded-md border border-dashed border-card-border px-3 py-3 text-left text-sm text-muted active:border-accent"
      >
        + Add an exercise...
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!savePlanMode && hasSessionActivity && (
        <div className="fixed bottom-24 left-3 z-20 rounded-lg border border-card-border bg-card/95 p-2 shadow-lg backdrop-blur">
          <p className="mb-1 text-center text-[9px] uppercase tracking-wide text-muted">This session</p>
          <BodyMap counts={sessionCounts} compact size={70} showLabels={false} />
        </div>
      )}

      <button
        type="button"
        disabled={isPending || selected.length === 0}
        onClick={savePlanMode ? handleSavePlan : () => setFinishChoiceOpen(true)}
        className="glow-accent rounded-md bg-accent px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-accent-ink disabled:opacity-50 disabled:shadow-none"
      >
        {isPending ? "Saving..." : savePlanMode ? "Save plan" : "Finish workout"}
      </button>

      {finishChoiceOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setFinishChoiceOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-xl border border-card-border bg-card p-4 sm:rounded-xl"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-center font-semibold">Finish workout</h2>
            <p className="mb-4 text-center text-sm text-muted">
              Add a photo or description, then post it to your feed or keep it private.
            </p>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            {photoPreview ? (
              <div className="relative mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt=""
                  className="h-40 w-full rounded-md border border-card-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  aria-label="Remove photo"
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <CloseIcon size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="mb-3 w-full rounded-md border border-dashed border-card-border px-3 py-3 text-center text-sm text-muted active:border-accent"
              >
                + Add photo
              </button>
            )}
            {photoError && <p className="mb-3 text-sm text-red-400">{photoError}</p>}

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a description (optional)"
              rows={2}
              maxLength={280}
              className="mb-3 w-full resize-none rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
            />

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleFinish(true)}
                className="glow-accent rounded-md bg-accent px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-accent-ink disabled:opacity-50 disabled:shadow-none"
              >
                {isPending ? "Saving..." : "Post to feed"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleFinish(false)}
                className="rounded-md border border-card-border px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-foreground disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Keep private"}
              </button>
              <button
                type="button"
                onClick={() => setFinishChoiceOpen(false)}
                className="mt-1 py-1 text-center text-sm text-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
