"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";

type Suggestion = { id: string; username: string; display_name: string | null; avatar_url: string | null };

export default function UsernameSearchInput({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced: suggestions are a live convenience on top of the input, not a
  // replacement for the form's own submit-to-see-everyone behavior below.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user-search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (!cancelled) setSuggestions(data.results ?? []);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <form className="relative flex gap-2">
      <input
        ref={inputRef}
        name="q"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
        placeholder="Search by username"
        className="flex-1 rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted"
      />
      <button type="submit" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-ink">
        Search
      </button>

      {open && query.trim().length > 0 && suggestions.length > 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-md border border-card-border bg-card shadow-lg">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false);
                router.push(`/profile/${s.username}`);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm active:bg-accent/10"
            >
              <Avatar url={s.avatar_url} name={s.display_name ?? s.username} size="sm" />
              <span className="min-w-0 truncate">
                <span className="font-medium">{s.display_name ?? s.username}</span>
                <span className="ml-2 text-muted">@{s.username}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
