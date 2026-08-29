"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/components/UIIcons";

// For pages reached from multiple different places (e.g. a workout can be
// opened from the feed, history, or a profile), where there's no single
// correct "parent" to hardcode as a Link — browser history is the only
// reliable way back.
export default function BackButton({ className = "text-muted" }: { className?: string }) {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.back()} aria-label="Back" className={className}>
      <ArrowLeftIcon size={20} />
    </button>
  );
}
