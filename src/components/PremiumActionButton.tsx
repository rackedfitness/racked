"use client";

import { useState } from "react";

export default function PremiumActionButton({
  mode,
  label,
  className,
}: {
  mode: "checkout" | "portal";
  label: string;
  className: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      // Apple requires digital subscriptions purchased *inside* the app to
      // go through their own In-App Purchase system — launching Stripe
      // Checkout from the native wrapper isn't allowed. Managing an
      // existing subscription (the "portal" mode) isn't a new purchase, so
      // that's left alone; only "checkout" is gated here.
      if (mode === "checkout") {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform()) {
          setError("Subscribe from racked-xyao.vercel.app in your browser — this can't be purchased in the app.");
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`/api/stripe/${mode}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Something went wrong");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={loading} className={className}>
        {loading ? "Redirecting..." : label}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
