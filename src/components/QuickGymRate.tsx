"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitGymReview } from "@/app/gyms/actions";
import StarRating from "@/components/StarRating";

function buildDetailHref(g: { placeId: string; name: string; address?: string | null }) {
  const params = new URLSearchParams({ placeId: g.placeId, name: g.name });
  if (g.address) params.set("address", g.address);
  return `/gyms/detail?${params.toString()}`;
}

// A one-tap star rating shown right after tagging a gym on a workout — the
// natural moment to rate it is right when you've just picked it, not a
// separate trip to the Gyms tab later. "Add more detail" hands off to the
// full review form (tags, text) on the gym's own page for anyone who wants
// to say more than a star count.
export default function QuickGymRate({
  placeId,
  gymName,
  gymAddress,
  lat,
  lng,
}: {
  placeId: string;
  gymName: string;
  gymAddress: string | null;
  lat: number | null;
  lng: number | null;
}) {
  const [rating, setRating] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function rate(n: number) {
    setRating(n);
    setError(null);
    startTransition(async () => {
      try {
        await submitGymReview({ placeId, gymName, gymAddress, lat, lng, rating: n, tags: [] });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save that — try again.");
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="flex items-center gap-1.5 text-muted">
        Rate this gym:
        <StarRating value={rating} onChange={rate} size={16} />
        {isPending && "Saving..."}
      </span>
      {saved && (
        <Link href={buildDetailHref({ placeId, name: gymName, address: gymAddress })} className="shrink-0 text-accent underline">
          Add more detail →
        </Link>
      )}
      {error && <span className="text-red-400">{error}</span>}
    </div>
  );
}
