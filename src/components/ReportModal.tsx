"use client";

import { useState, useTransition } from "react";
import { reportContent } from "@/app/moderation/actions";

export default function ReportModal({
  reportedUserId,
  workoutId,
  onClose,
}: {
  reportedUserId?: string;
  workoutId?: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await reportContent({ reportedUserId, workoutId, reason });
        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-xl border border-card-border bg-card p-4 sm:rounded-xl"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <>
            <h2 className="mb-1 text-center font-semibold">Report submitted</h2>
            <p className="mb-4 text-center text-sm text-muted">Thanks — we&rsquo;ll take a look.</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-md border border-card-border px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-foreground"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-1 text-center font-semibold">Report {workoutId ? "workout" : "user"}</h2>
            <p className="mb-3 text-center text-sm text-muted">Tell us what&rsquo;s wrong — this isn&rsquo;t public.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What's happening?"
              rows={3}
              maxLength={500}
              autoFocus
              className="mb-3 w-full resize-none rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
            />
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={submit}
                disabled={isPending || !reason.trim()}
                className="rounded-md bg-accent px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-accent-ink disabled:opacity-50"
              >
                {isPending ? "Submitting..." : "Submit report"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-1 text-center text-sm text-muted"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
