"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getReviewedGyms, type ReviewedGym } from "@/app/gyms/actions";
import { haversineKm } from "@/lib/geo";
import GymMap from "@/components/GymMapClient";
import type { GymMapPin } from "@/components/GymMap";
import StarRating from "@/components/StarRating";
import { ArrowLeftIcon, CloseIcon } from "@/components/UIIcons";

type SearchResult = { name: string; address: string | null; placeId: string | null; lat: number | null; lng: number | null };
type AreaResult = { label: string; address: string | null; lat: number; lng: number };
type Focus = { label: string; lat: number; lng: number };

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

  const [areaQuery, setAreaQuery] = useState("");
  const [areaOpen, setAreaOpen] = useState(false);
  const [areaResults, setAreaResults] = useState<AreaResult[]>([]);
  const [areaSearching, setAreaSearching] = useState(false);

  const [reviewed, setReviewed] = useState<ReviewedGym[]>([]);
  const [loadingReviewed, setLoadingReviewed] = useState(true);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  useEffect(() => {
    getReviewedGyms()
      .then(setReviewed)
      .finally(() => setLoadingReviewed(false));
  }, []);

  // Debounced, same pattern as GymPicker — hits a paid third-party API.
  // Biased near `focus` (an area you've browsed to, or "Near me") once one
  // is set, so e.g. "puregym" ranks the Manchester branch first once you've
  // browsed to Manchester, without hiding branches anywhere else.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: trimmed });
        if (focus) {
          params.set("lat", String(focus.lat));
          params.set("lon", String(focus.lng));
        }
        const res = await fetch(`/api/gym-search?${params.toString()}`);
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
  }, [query, focus]);

  // Same debounce pattern again, for resolving an area (city/neighborhood)
  // to browse rather than a specific gym.
  useEffect(() => {
    const trimmed = areaQuery.trim();
    if (trimmed.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setAreaSearching(true);
      try {
        const res = await fetch(`/api/area-search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (!cancelled) setAreaResults(data.results ?? []);
      } catch {
        if (!cancelled) setAreaResults([]);
      } finally {
        if (!cancelled) setAreaSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [areaQuery]);

  function locateMe() {
    if (!navigator.geolocation) {
      setLocateError("Location isn't available on this device.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFocus({ label: "your location", lat: pos.coords.latitude, lng: pos.coords.longitude });
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

  // Once you've browsed to an area, "gyms other users reviewed" is far more
  // useful sorted by distance from there than by raw review count.
  const sortedReviewed = reviewed
    .slice()
    .sort((a, b) => {
      if (focus && a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
        return haversineKm(focus, { lat: a.lat, lng: a.lng }) - haversineKm(focus, { lat: b.lat, lng: b.lng });
      }
      return b.reviewCount - a.reviewCount;
    });

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
          placeholder="Search a gym, brand, or hotel..."
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

      {/* Browsing a different area — separate from the gym search above:
          this resolves a city/neighborhood and re-centers the map + biases
          the gym search near it, for "what's around here" when you're
          somewhere new rather than looking for one specific gym. */}
      {focus ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
          <span className="truncate text-accent">📍 Browsing near {focus.label}</span>
          <button
            type="button"
            onClick={() => {
              setFocus(null);
              setAreaQuery("");
            }}
            aria-label="Clear area"
            className="shrink-0 text-muted active:text-foreground"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={areaQuery}
            onChange={(e) => {
              setAreaQuery(e.target.value);
              setAreaOpen(true);
            }}
            onFocus={() => setAreaOpen(true)}
            onBlur={() => setTimeout(() => setAreaOpen(false), 150)}
            placeholder="Browse a different area — city, neighborhood..."
            className="w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted"
          />
          {areaOpen && areaQuery.trim().length >= 2 && (
            <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-md border border-card-border bg-card shadow-lg">
              {areaSearching ? (
                <p className="px-3 py-2 text-sm text-muted">Searching...</p>
              ) : areaResults.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted">No places found.</p>
              ) : (
                areaResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setFocus({ label: r.label, lat: r.lat, lng: r.lng });
                      setAreaQuery("");
                      setAreaOpen(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm active:bg-accent/10"
                  >
                    <span className="block font-medium">{r.label}</span>
                    {r.address && <span className="block truncate text-xs text-muted">{r.address}</span>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="h-72 overflow-hidden rounded-lg border border-card-border">
        {pins.length === 0 && !focus && !loadingReviewed ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted">
            No reviewed gyms to show yet — search above and be the first to review one.
          </div>
        ) : (
          <GymMap pins={pins} center={focus} onSelectPin={onSelectPin} />
        )}
      </div>

      {reviewed.length > 0 && (
        <div>
          <h2 className="mb-2 font-semibold">{focus ? `Closest to ${focus.label}` : "Reviewed by Racked users"}</h2>
          <div className="flex flex-col gap-2">
            {sortedReviewed.map((g) => (
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
