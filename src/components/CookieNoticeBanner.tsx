"use client";

import { useState } from "react";
import Link from "next/link";

const DISMISS_COOKIE = "racked_cookie_notice_ack";

export default function CookieNoticeBanner({ initiallyDismissed }: { initiallyDismissed: boolean }) {
  const [dismissed, setDismissed] = useState(initiallyDismissed);

  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    // The server reads this same cookie to decide whether to render the
    // banner at all on the next page load — same pattern as the onboarding
    // and premium-promo dismiss cookies.
    document.cookie = `${DISMISS_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 365}`;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-20 z-30 mx-auto flex max-w-lg flex-col gap-2 border-t border-card-border bg-card p-3 text-xs text-muted shadow-lg sm:bottom-4 sm:mx-4 sm:rounded-lg sm:border"
      role="region"
      aria-label="Cookie notice"
    >
      <p>
        Racked only uses strictly-necessary cookies to keep you signed in — no tracking, advertising, or
        analytics cookies.{" "}
        <Link href="/cookies" className="underline">
          Learn more
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="self-end rounded-md bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-accent-ink"
      >
        Got it
      </button>
    </div>
  );
}
