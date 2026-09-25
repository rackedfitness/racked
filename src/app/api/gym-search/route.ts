import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

type FoursquarePlace = {
  fsq_id?: string;
  fsq_place_id?: string;
  name?: string;
  geocodes?: { main?: { latitude?: number; longitude?: number } };
  location?: { formatted_address?: string };
};

type GymResult = { name: string; address: string | null; placeId: string | null; lat: number | null; lng: number | null };

function mapResults(data: FoursquarePlace[]): GymResult[] {
  return (Array.isArray(data) ? data : []).map((r) => ({
    name: r.name ?? "Gym",
    address: r.location?.formatted_address ?? null,
    // Foursquare renamed fsq_id -> fsq_place_id in newer API versions —
    // accept either so this doesn't silently break on a version bump.
    placeId: r.fsq_place_id ?? r.fsq_id ?? null,
    lat: r.geocodes?.main?.latitude ?? null,
    lng: r.geocodes?.main?.longitude ?? null,
  }));
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const nearLat = Number(request.nextUrl.searchParams.get("lat"));
  const nearLon = Number(request.nextUrl.searchParams.get("lon"));
  const near = Number.isFinite(nearLat) && Number.isFinite(nearLon) && request.nextUrl.searchParams.has("lat") ? { lat: nearLat, lon: nearLon } : null;

  // This calls a paid-tier-capable third-party API per request — require
  // login and cap how often any one user can call it, so it can't be
  // scripted into an unbounded Foursquare bill.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const withinLimit = await checkRateLimit({
    userId: user.id,
    bucket: "gym-search",
    windowSeconds: 60,
    maxRequests: 30,
  });
  if (!withinLimit) {
    return NextResponse.json({ error: "Too many searches — try again in a minute." }, { status: 429 });
  }

  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) return NextResponse.json({ results: [] });

  // Foursquare's Places database is a proper commercial POI directory
  // (unlike OpenStreetMap, which is crowd-mapped and tags gym chains
  // inconsistently) — a plain relevance search on the query text is enough
  // to find named brands reliably, no tag-based filtering or fallback pass
  // needed the way the old LocationIQ/OSM search required.
  const url = new URL("https://api.foursquare.com/v3/places/search");
  url.searchParams.set("query", q);
  url.searchParams.set("limit", "8");
  if (near) {
    // Biases ranking toward this point rather than restricting to it (no
    // `radius` set), so a brand search still finds matches anywhere while
    // ranking the closest ones first.
    url.searchParams.set("ll", `${near.lat},${near.lon}`);
  }

  try {
    const res = await fetch(url, {
      headers: { Authorization: apiKey, Accept: "application/json" },
    });
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = await res.json();
    return NextResponse.json({ results: mapResults(data.results ?? []) });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
