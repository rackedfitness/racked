"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getReviewedGyms, type ReviewedGym } from "@/app/gyms/actions";
import GymMap from "@/components/GymMapClient";
import type { GymMapPin } from "@/components/GymMap";
import StarRating from "@/components/StarRating";
import { ArrowLeftIcon } from "@/components/UIIcons";

type SearchResult = { name: string; address: string | null; placeId: string | null; lat: number | null; lng: number | null };

function buildDetailHref(g: { placeId: string; name: string; address?: string | null; lat?: number | null; lng?: number | null }) {
  const params = new URLSearchParams({ placeId: g.placeId, name: g.name });
  if (g.address) params.set("address", g.address);
  if (g.lat != null) params.set("lat", String(g.lat));
  if (g.lng != null) params.set("lng", String(g.lng));
  return `/gyms/detail?${params.toString()}`;
}

export default function GymsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [reviewed, setReviewed] = useState<ReviewedGym[]>([]);
  const [loadingReviewed, setLoadingReviewed] = useState(true);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  useEffect(() => {
    getReviewedGyms()
      .then(setReviewed)
      .finally(() => setLoadingReviewed(false));
  }, []);

  // Debounced, same pattern as GymPicker — hits a paid third-party API.
  useEffect(() => {
    const trimmed = query.trim();
    // Nothing to clear when too short — the dropdown below is only rendered
    // once the query is >= 2 chars anyway, so a stale `results` array here
    // is simply never shown.
    if (trimmed.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/gym-search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (!cancelled) setResults(data.results ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function locateMe() {
    if (!navigator.geolocation) {
      setLocateError("Location isn't available on this device.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocateError("Couldn't get your location — check location permissions.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  const pins: GymMapPin[] = reviewed
    .filter((g): g is ReviewedGym & { lat: number; lng: number } => g.lat != null && g.lng != null)
    .map((g) => ({ placeId: g.placeId, name: g.name, lat: g.lat, lng: g.lng, avgRating: g.avgRating, reviewCount: g.reviewCount }));

  const onSelectPin = useCallback(
    (placeId: string) => {
      const gym = reviewed.find((g) => g.placeId === placeId);
      if (gym) router.push(buildDetailHref(gym));
    },
    [reviewed, router]
  );

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-bold">Gyms</h1>
      </div>
      <p className="-mt-2 text-sm text-muted">
        Find a gym anywhere — hotel gyms included — and see what other Racked users thought of it.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a gym, city, or hotel..."
          className="flex-1 rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted"
        />
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="shrink-0 rounded-md border border-card-border px-3 py-2 text-sm text-foreground disabled:opacity-50"
        >
          {locating ? "Locating..." : "📍 Near me"}
        </button>
      </div>
      {locateError && <p className="text-xs text-red-400">{locateError}</p>}

      {query.trim().length >= 2 && (
        <div className="flex flex-col divide-y divide-card-border rounded-lg border border-card-border bg-card">
          {searching ? (
            <p className="px-3 py-3 text-sm text-muted">Searching...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted">No gyms found.</p>
          ) : (
            results
              .filter((r) => r.placeId)
              .map((r) => (
                <Link
                  key={r.placeId}
                  href={buildDetailHref({ placeId: r.placeId!, name: r.name, address: r.address, lat: r.lat, lng: r.lng })}
                  className="block px-3 py-2.5 text-sm active:bg-accent/10"
                >
                  <span className="block font-medium">{r.name}</span>
                  {r.address && <span className="block truncate text-xs text-muted">{r.address}</span>}
                </Link>
              ))
          )}
        </div>
      )}

      <div className="h-72 overflow-hidden rounded-lg border border-card-border">
        {pins.length === 0 && !center && !loadingReviewed ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted">
            No reviewed gyms to show yet — search above and be the first to review one.
          </div>
        ) : (
          <GymMap pins={pins} center={center} onSelectPin={onSelectPin} />
        )}
      </div>

      {reviewed.length > 0 && (
        <div>
          <h2 className="mb-2 font-semibold">Reviewed by Racked users</h2>
          <div className="flex flex-col gap-2">
            {reviewed
              .slice()
              .sort((a, b) => b.reviewCount - a.reviewCount)
              .map((g) => (
                <Link
                  key={g.placeId}
                  href={buildDetailHref(g)}
                  className="flex items-center justify-between gap-3 rounded-lg border border-card-border bg-card p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{g.name}</p>
                    {g.address && <p className="truncate text-xs text-muted">{g.address}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StarRating value={g.avgRating} />
                    <span className="tnum text-xs text-muted">({g.reviewCount})</span>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
