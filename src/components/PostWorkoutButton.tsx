"use client";

import { useState } from "react";

export default function PostWorkoutButton({
  title,
  summary,
}: {
  title: string;
  summary: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "posted">("idle");

  async function handlePost() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: summary, url });
        setStatus("posted");
      } catch {
        // user cancelled the share sheet — not an error
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${summary}\n${url}`);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePost}
      className="glow-accent w-full rounded-md bg-accent px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-accent-ink"
    >
      {status === "copied" ? "Copied to clipboard" : status === "posted" ? "Posted" : "Post workout"}
    </button>
  );
}
