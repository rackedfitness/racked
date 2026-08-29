"use client";

import { useState, useTransition } from "react";
import { deleteMyData } from "@/app/settings/actions";

export default function DeleteDataButton() {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-red-900 px-3 py-1.5 text-sm text-red-400"
      >
        Delete all my data
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-red-400">Delete all workouts, plans & measurements?</span>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => deleteMyData())}
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {isPending ? "Deleting..." : "Confirm delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-md border border-card-border px-3 py-1.5 text-sm text-muted"
      >
        Cancel
      </button>
    </div>
  );
}
