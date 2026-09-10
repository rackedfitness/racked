"use client";

import { useState } from "react";
import Link from "next/link";
import { CloseIcon } from "@/components/UIIcons";

const DISMISS_COOKIE = "racked_premium_promo_dismissed";

export default function PremiumPromoBanner({ initiallyDismissed }: { initiallyDismissed: boolean }) {
  const [dismissed, setDismissed] = useState(initiallyDismissed);

  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    // A year is effectively "don't show again" without needing a DB column
    // for something this low-stakes — the server reads this same cookie to
    // decide whether to render the banner at all on the next page load.
    document.cookie = `${DISMISS_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 365}`;
  }

  return (
    <div className="relative flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 p-3 pr-8">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 text-muted active:text-foreground"
      >
        <CloseIcon size={14} />
      </button>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-accent">✨ Try Racked Premium</p>
        <p className="mt-0.5 text-xs text-muted">AI-generated workouts, deeper rankings, and more.</p>
      </div>
      <Link
        href="/premium"
        className="glow-accent-sm shrink-0 rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-accent-ink"
      >
        Subscribe
      </Link>
    </div>
  );
}
