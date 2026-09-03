"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/stats";

const ITEM_HEIGHT = 44;
const MAX_SECONDS = 600;
const OPTIONS = Array.from({ length: MAX_SECONDS / 5 + 1 }, (_, i) => i * 5);
const VISIBLE_ROWS = 5;
const PAD = ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2);

export default function RestPickerSheet({
  initialSeconds,
  onConfirm,
  onClose,
}: {
  initialSeconds: number;
  onConfirm: (seconds: number) => void;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(initialSeconds);

  useEffect(() => {
    const idx = Math.max(0, OPTIONS.indexOf(initialSeconds));
    scrollRef.current?.scrollTo({ top: idx * ITEM_HEIGHT });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.min(OPTIONS.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_HEIGHT)));
    setSelected(OPTIONS[idx]);
  }

  function scrollToIndex(idx: number) {
    scrollRef.current?.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "smooth" });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl border border-card-border bg-card p-4 sm:rounded-2xl"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-center font-semibold">Rest time</h2>

        <div className="relative" style={{ height: ITEM_HEIGHT * VISIBLE_ROWS }}>
          <div
            className="pointer-events-none absolute inset-x-0 rounded-lg border-y-2 border-accent/50 bg-accent/10"
            style={{ top: PAD, height: ITEM_HEIGHT }}
          />
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full overflow-y-scroll"
            style={{ scrollSnapType: "y mandatory", paddingTop: PAD, paddingBottom: PAD }}
          >
            {OPTIONS.map((secs, idx) => (
              <div
                key={secs}
                onClick={() => scrollToIndex(idx)}
                style={{ height: ITEM_HEIGHT, scrollSnapAlign: "center" }}
                className={`tnum flex cursor-pointer items-center justify-center text-lg transition-colors ${
                  secs === selected ? "font-bold text-accent" : "text-muted"
                }`}
              >
                {secs === 0 ? "No rest" : formatDuration(secs)}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onConfirm(selected);
            onClose();
          }}
          className="glow-accent mt-4 w-full rounded-md bg-accent px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-accent-ink"
        >
          Set rest time
        </button>
      </div>
    </div>
  );
}
