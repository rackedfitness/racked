"use client";

import { useMemo, useState } from "react";
import type { Exercise } from "@/types/database";
import ExerciseIcon from "@/components/ExerciseIcon";
import { ArrowLeftIcon, CloseIcon } from "@/components/UIIcons";

const CATEGORIES: { key: string; label: string }[] = [
  { key: "chest", label: "Chest" },
  { key: "back", label: "Back" },
  { key: "legs", label: "Legs" },
  { key: "shoulders", label: "Shoulders" },
  { key: "arms", label: "Arms" },
  { key: "core", label: "Core" },
  { key: "cardio", label: "Cardio" },
];

export default function ExercisePicker({
  exercises,
  excludeIds,
  onAdd,
  onClose,
}: {
  exercises: Exercise[];
  excludeIds: string[];
  onAdd: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const available = useMemo(() => {
    const excluded = new Set(excludeIds);
    return exercises.filter((e) => !excluded.has(e.id));
  }, [exercises, excludeIds]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return available.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 30);
  }, [query, available]);

  const categoryResults = useMemo(() => {
    if (!category) return [];
    return available.filter((e) => e.category === category).sort((a, b) => a.name.localeCompare(b.name));
  }, [category, available]);

  function handleAdd(exercise: Exercise) {
    onAdd(exercise);
    onClose();
  }

  const isSearching = query.trim().length > 0;
  const inCategory = !isSearching && category !== null;

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-background">
      <div
        className="flex items-center gap-2 border-b border-card-border p-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        {inCategory && (
          <button
            type="button"
            onClick={() => setCategory(null)}
            aria-label="Back to muscle groups"
            className="flex h-11 w-11 shrink-0 items-center justify-center text-muted active:text-foreground"
          >
            <ArrowLeftIcon size={20} />
          </button>
        )}
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className="flex-1 rounded-md border border-card-border bg-card px-3 py-2.5 text-foreground placeholder:text-muted"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-muted active:text-foreground"
        >
          <CloseIcon size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 pb-8">
        {isSearching ? (
          <div className="flex flex-col divide-y divide-card-border">
            {searchResults.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => handleAdd(ex)}
                className="flex min-h-[3rem] items-center justify-between gap-2 py-3 text-left active:text-accent"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <ExerciseIcon equipment={ex.equipment} size={24} />
                  <span className="truncate">{ex.name}</span>
                </span>
                {ex.category && <span className="shrink-0 text-xs text-muted">{ex.category}</span>}
              </button>
            ))}
            {searchResults.length === 0 && (
              <p className="py-8 text-center text-sm text-muted">No exercises found.</p>
            )}
          </div>
        ) : inCategory ? (
          <div className="flex flex-col gap-1">
            <h2 className="mb-1 px-1 text-xs uppercase tracking-wide text-muted">
              {CATEGORIES.find((c) => c.key === category)?.label}
            </h2>
            <div className="flex flex-col divide-y divide-card-border">
              {categoryResults.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleAdd(ex)}
                  className="flex min-h-[3rem] items-center justify-between gap-2 py-3 text-left active:text-accent"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <ExerciseIcon equipment={ex.equipment} size={24} />
                    <span className="truncate">{ex.name}</span>
                  </span>
                  {ex.equipment && <span className="shrink-0 text-xs text-muted">{ex.equipment}</span>}
                </button>
              ))}
              {categoryResults.length === 0 && (
                <p className="py-8 text-center text-sm text-muted">No exercises in this category yet.</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className="mb-2 px-1 text-xs uppercase tracking-wide text-muted">Muscle group</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className="min-h-[4.5rem] rounded-lg border border-card-border bg-card p-5 text-left font-semibold uppercase tracking-wide active:border-accent active:bg-accent/10"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
