"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import RankBadge from "@/components/RankBadge";
import type { RankTier } from "@/lib/rankSystem";

export type RankUpToast = { exerciseName: string; rank: RankTier };

// Reused both live (WorkoutBuilder, right after the set that crossed a tier)
// and post-workout (the detail page's recap) — callers own a queue and pass
// one event at a time, since multiple rank-ups can happen in one session.
export default function RankUpOverlay({ event, onDone }: { event: RankUpToast | null; onDone: () => void }) {
  useEffect(() => {
    if (!event) return;
    confetti({
      particleCount: 140,
      spread: 100,
      startVelocity: 55,
      origin: { y: 0.5 },
      colors: [event.rank.color, "#ffffff"],
      ticks: 200,
      shapes: ["star", "circle"],
    });
    const timer = setTimeout(onDone, 2800);
    return () => clearTimeout(timer);
  }, [event, onDone]);

  if (!event) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/80"
      onClick={onDone}
    >
      <div className="animate-rank-up-pop">
        <RankBadge rank={event.rank} size={120} />
      </div>
      <div className="animate-rank-up-text flex flex-col items-center gap-1">
        <p className="text-2xl font-black uppercase tracking-wide" style={{ color: event.rank.color }}>
          Rank Up!
        </p>
        <p className="text-sm text-muted">
          {event.exerciseName} is now{" "}
          <span className="font-semibold" style={{ color: event.rank.color }}>
            {event.rank.label}
          </span>
        </p>
      </div>
    </div>
  );
}
