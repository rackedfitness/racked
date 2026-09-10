"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { copyTemplate } from "@/app/workout/actions";

export default function CopyPlanButton({ templateId }: { templateId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await copyTemplate(templateId);
      } catch (err) {
        // copyTemplate redirect()s on success, which works by throwing —
        // must let that through, not treat it as a real failure
        unstable_rethrow(err);
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-full border border-card-border px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-50"
      >
        {isPending ? "Copying..." : "Copy"}
      </button>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
