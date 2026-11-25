"use client";

import { useEffect, useRef } from "react";
import RankBadge from "@/components/RankBadge";
import { celebrateRankUp, startShakeLoop } from "@/lib/celebrate";
import { playRankUpSound } from "@/lib/sound";
import type { RankTier } from "@/lib/rankSystem";

export type RankUpToast = { exerciseName: string; rank: RankTier };

// The badge's slam animation (.animate-rank-up-pop) lands ~40% of the way
// through its 0.7s — everything loud (sound, shake, flash, confetti) fires on
// that beat rather than the moment the overlay mounts.
const LANDING_MS = 280;
// How long the one-off landing jolt (shakeScreen in celebrateRankUp) runs
// before the continuous side-to-side shake takes over.
const JOLT_MS = 950;
const LOOP_AMPLITUDE_PX = 7;

// Reused both live (WorkoutBuilder, right after the set that crossed a tier)
// and post-workout (the detail page's recap) — callers own a queue and pass
// one event at a time, since multiple rank-ups can happen in one session.
// It stays up, shaking, until tapped.
export default function RankUpOverlay({ event, onDone }: { event: RankUpToast | null; onDone: () => void }) {
  // Callers pass an inline onDone, so its identity changes on every parent
  // re-render (WorkoutBuilder re-renders every second for its timer). Reading
  // it through a ref keeps the effect below keyed on `event` alone — otherwise
  // each tick would restart the whole celebration.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!event) return;
    let stopLoop = () => {};
    const landing = setTimeout(() => {
      playRankUpSound();
      celebrateRankUp(event.rank.color);
    }, LANDING_MS);
    const loop = setTimeout(() => {
      stopLoop = startShakeLoop(LOOP_AMPLITUDE_PX);
    }, LANDING_MS + JOLT_MS);
    // Runs when the overlay is tapped away (event -> null) or unmounts, so the
    // page never gets left shaking.
    return () => {
      clearTimeout(landing);
      clearTimeout(loop);
      stopLoop();
    };
  }, [event]);

  if (!event) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80"
      onClick={() => onDoneRef.current()}
    >
      <div className="animate-rank-up-screen-shake flex flex-col items-center gap-3">
        <div className="animate-rank-up-pop">
          <div className="animate-rank-up-badge-wobble">
            <RankBadge rank={event.rank} size={240} />
          </div>
        </div>
        <div className="animate-rank-up-text flex flex-col items-center gap-1">
          <p
            className="text-4xl font-black uppercase tracking-wide"
            style={{ color: event.rank.color, textShadow: `0 0 28px ${event.rank.color}` }}
          >
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
      <p className="absolute bottom-16 animate-pulse text-xs uppercase tracking-widest text-muted">Tap to continue</p>
    </div>
  );
}
