"use client";

import { useState } from "react";
import { backfillPrCounts } from "@/app/admin/actions";

export default function BackfillPrCountsButton() {
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [result, setResult] = useState<number | null>(null);

  async function handleClick() {
    setStatus("working");
    setResult(null);
    try {
      const { updated } = await backfillPrCounts();
      setResult(updated);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "working"}
        className="rounded-md border border-card-border px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-60"
      >
        {status === "working" ? "Backfilling..." : "Backfill PR counts"}
      </button>
      {result !== null && <span className="text-sm text-muted">Updated {result} workouts.</span>}
      {status === "error" && <span className="text-sm text-red-400">Failed — try again.</span>}
    </div>
  );
}
