"use client";

// Display-only by default (no onChange); pass onChange to make it an
// interactive 1-5 picker, used both for showing a gym's aggregate rating and
// for collecting one in the review form.
export default function StarRating({
  value,
  onChange,
  size = 18,
}: {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
}) {
  const stars = [1, 2, 3, 4, 5];
  const interactive = Boolean(onChange);

  return (
    <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined} aria-label="Rating">
      {stars.map((n) =>
        interactive ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => onChange!(n)}
            className="leading-none"
            style={{ fontSize: size, color: n <= value ? "var(--accent)" : "var(--muted)" }}
          >
            {n <= value ? "★" : "☆"}
          </button>
        ) : (
          <span key={n} aria-hidden className="leading-none" style={{ fontSize: size, color: n <= value ? "var(--accent)" : "var(--muted)" }}>
            {n <= Math.round(value) ? "★" : "☆"}
          </span>
        )
      )}
    </div>
  );
}
