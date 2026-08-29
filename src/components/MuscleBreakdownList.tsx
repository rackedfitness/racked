"use client";

import { useState } from "react";
import { intensityColor } from "@/components/BodyMap";
import { ArrowUpIcon, ArrowDownIcon } from "@/components/UIIcons";

const CATEGORY_LABELS: Record<string, string> = {
  chest: "Chest",
  back: "Back",
  legs: "Legs",
  shoulders: "Shoulders",
  arms: "Arms",
  core: "Core",
  cardio: "Cardio",
};

export default function MuscleBreakdownList({ counts }: { counts: Record<string, number> }) {
  const [ascending, setAscending] = useState(false);

  const sorted = Object.entries(counts).sort((a, b) => (ascending ? a[1] - b[1] : b[1] - a[1]));

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <button
        type="button"
        onClick={() => setAscending((v) => !v)}
        aria-label={ascending ? "Sorted ascending, tap for descending" : "Sorted descending, tap for ascending"}
        className="flex h-7 w-7 items-center justify-center self-start rounded-full border border-card-border text-muted active:text-foreground"
      >
        {ascending ? <ArrowUpIcon size={15} /> : <ArrowDownIcon size={15} />}
      </button>
      <div className="flex flex-col gap-1.5">
        {sorted.map(([category, count]) => (
          <div key={category} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              <span
                className="h-2 w-2 shrink-0 rounded-full border border-card-border"
                style={{ background: intensityColor(count) }}
              />
              <span className="truncate">{CATEGORY_LABELS[category] ?? category}</span>
            </span>
            <span className="tnum shrink-0 text-muted">{count}x</span>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-sm text-muted">No data yet.</p>}
      </div>
    </div>
  );
}
