"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitGymReview, deleteGymReview } from "@/app/gyms/actions";
import { GYM_TAGS } from "@/lib/gymTags";
import StarRating from "@/components/StarRating";
import type { GymReviewRow } from "@/app/gyms/actions";

export default function GymReviewForm({
  placeId,
  gymName,
  gymAddress,
  lat,
  lng,
  myReview,
}: {
  placeId: string;
  gymName: string;
  gymAddress: string | null;
  lat: number | null;
  lng: number | null;
  myReview: GymReviewRow | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [body, setBody] = useState(myReview?.body ?? "");
  const [tags, setTags] = useState<string[]>(myReview?.tags ?? []);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleTag(value: string) {
    setTags((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
  }

  function submit() {
    if (rating < 1) {
      setError("Pick a star rating first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await submitGymReview({ placeId, gymName, gymAddress, lat, lng, rating, body, tags });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  function remove() {
    if (!myReview) return;
    startTransition(async () => {
      try {
        await deleteGymReview(myReview.id);
        setRating(0);
        setBody("");
        setTags([]);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-card-border bg-card p-4">
      <p className="font-semibold">{myReview ? "Edit your review" : "Rate this gym"}</p>

      <StarRating value={rating} onChange={setRating} size={26} />

      <div className="flex flex-wrap gap-1.5">
        {GYM_TAGS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => toggleTag(t.value)}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              tags.includes(t.value)
                ? "border-accent bg-accent/15 text-accent"
                : "border-card-border text-muted"
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Anything worth knowing — equipment, crowds, day-pass price..."
        rows={3}
        maxLength={600}
        className="resize-none rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="flex-1 rounded-md bg-accent px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-accent-ink disabled:opacity-50"
        >
          {isPending ? "Saving..." : myReview ? "Update review" : "Submit review"}
        </button>
        {myReview && (
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="rounded-md border border-card-border px-3 py-2.5 text-sm text-red-400 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
