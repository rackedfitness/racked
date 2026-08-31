"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { formatDuration } from "@/lib/stats";

export function draftKeyFor(userId: string) {
  return `racked_active_workout_${userId}`;
}

// Dispatched by WorkoutBuilder whenever it writes/clears its draft, so this
// bar (mounted once in the root layout, never remounted by navigation)
// picks up the change immediately rather than waiting for a route change.
export const DRAFT_UPDATED_EVENT = "racked:draft-updated";

type StoredDraft = { title: string; startedAt: string };

export default function ActiveWorkoutBar({ userId }: { userId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [draft, setDraft] = useState<StoredDraft | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    function readDraft() {
      try {
        const raw = localStorage.getItem(draftKeyFor(userId));
        setDraft(raw ? JSON.parse(raw) : null);
      } catch {
        setDraft(null);
      }
    }
    readDraft();
    window.addEventListener("storage", readDraft);
    window.addEventListener(DRAFT_UPDATED_EVENT, readDraft);
    return () => {
      window.removeEventListener("storage", readDraft);
      window.removeEventListener(DRAFT_UPDATED_EVENT, readDraft);
    };
    // Re-check on every navigation too, in case the tab was backgrounded and
    // another tab/device cleared or changed the draft in the meantime.
  }, [userId, pathname]);

  useEffect(() => {
    if (!draft) return;
    const interval = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [draft]);

  if (!draft || pathname === "/workout/new") return null;

  const elapsedSeconds = Math.max(0, Math.floor((nowTs - new Date(draft.startedAt).getTime()) / 1000));

  return (
    <button
      type="button"
      onClick={() => router.push("/workout/new?resume=1")}
      className="glow-accent-sm fixed inset-x-3 z-30 flex items-center justify-between rounded-lg border border-accent bg-card/95 px-4 py-3 text-left backdrop-blur active:opacity-90"
      style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
    >
      <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-accent" />
        <span className="truncate">{draft.title || "Workout"} in progress</span>
      </span>
      <span className="tnum shrink-0 pl-2 text-sm text-accent">{formatDuration(elapsedSeconds)}</span>
    </button>
  );
}
