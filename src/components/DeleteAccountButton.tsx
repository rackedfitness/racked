"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { deleteMyAccount } from "@/app/settings/actions";

export default function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-red-900 px-3 py-1.5 text-sm text-red-400"
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-red-400">
        This permanently deletes your account, login, and everything tied to it — not just your workouts. This
        can&rsquo;t be undone.
      </span>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              try {
                await deleteMyAccount();
              } catch (err) {
                // deleteMyAccount redirect()s on success, which works by
                // throwing — must let that through, not treat it as a
                // real failure
                unstable_rethrow(err);
                setError(err instanceof Error ? err.message : "Something went wrong");
              }
            })
          }
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {isPending ? "Deleting..." : "Permanently delete account"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md border border-card-border px-3 py-1.5 text-sm text-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
