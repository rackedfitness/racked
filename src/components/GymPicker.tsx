"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/UIIcons";

export type SelectedGym = { name: string; address: string | null; placeId: string | null };

export default function GymPicker({
  value,
  onChange,
}: {
  value: SelectedGym | null;
  onChange: (gym: SelectedGym | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SelectedGym[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Debounced: fires ~350ms after typing pauses, not on every keystroke —
  // this hits a real third-party API with its own rate limits. State updates
  // happen inside the timer's callback (not the effect body itself) so a
  // superseded request's response never overwrites a newer one.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/gym-search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (!cancelled) setResults(data.results ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-card-border bg-background px-3 py-2 text-sm">
        <span className="flex min-w-0 items-center gap-1.5">
          <span aria-hidden>📍</span>
          <span className="truncate">
            <span className="font-medium">{value.name}</span>
            {value.address && <span className="text-muted"> · {value.address}</span>}
          </span>
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove gym"
          className="shrink-0 text-muted active:text-foreground"
        >
          <CloseIcon size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search for the gym you trained at (optional)"
        className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-md border border-card-border bg-card shadow-lg">
          {loading ? (
            <p className="px-3 py-2 text-sm text-muted">Searching...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted">No gyms found.</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.placeId ?? i}
                type="button"
                // Fires the click before the input's onBlur can close this
                // dropdown out from under it.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(r);
                  setQuery("");
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm active:bg-accent/10"
              >
                <span className="block font-medium">{r.name}</span>
                {r.address && <span className="block truncate text-xs text-muted">{r.address}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
