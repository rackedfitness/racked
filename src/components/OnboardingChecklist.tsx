"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckIcon, CloseIcon } from "@/components/UIIcons";

const DISMISS_COOKIE = "racked_onboarding_dismissed";

type Item = { label: string; done: boolean; href: string };

export default function OnboardingChecklist({
  items,
  initiallyDismissed,
}: {
  items: Item[];
  initiallyDismissed: boolean;
}) {
  const [dismissed, setDismissed] = useState(initiallyDismissed);
  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    document.cookie = `${DISMISS_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 365}`;
  }

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="relative rounded-lg border border-accent/40 bg-accent/10 p-4 pr-9">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 text-muted active:text-foreground"
      >
        <CloseIcon size={14} />
      </button>
      <p className="mb-3 text-sm font-semibold text-accent">
        Get set up ({doneCount}/{items.length})
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-2 text-sm ${item.done ? "text-muted line-through" : "text-foreground"}`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                item.done ? "border-accent bg-accent text-accent-ink" : "border-card-border"
              }`}
            >
              {item.done && <CheckIcon size={12} />}
            </span>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
