import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

// Restricts results to places actually tagged as a gym/fitness facility in
// OpenStreetMap — without this, searching a common word ("gold") would surface
// any business with that name, not just gyms. Kept as the first, precise pass;
// see the fallback below for why it can't be the only pass.
const GYM_TAGS = "leisure:fitness_centre,leisure:gym,leisure:sports_centre";

type LocationIqResult = {
  place_id?: string;
  display_place?: string;
  display_name?: string;
  display_address?: string;
  lat?: string;
  lon?: string;
};

type GymResult = { name: string; address: string | null; placeId: string | null; lat: number | null; lng: number | null };

function mapResults(data: LocationIqResult[]): GymResult[] {
  return (Array.isArray(data) ? data : []).map((r) => ({
    name: r.display_place ?? r.display_name?.split(",")[0] ?? "Gym",
    address: r.display_address ?? null,
    placeId: r.place_id ?? null,
    lat: r.lat ? Number(r.lat) : null,
    lng: r.lon ? Number(r.lon) : null,
  }));
}

async function searchLocationIq(q: string, apiKey: string, opts: { tag?: string; near?: { lat: number; lon: number } | null }) {
  const url = new URL("https://api.locationiq.com/v1/autocomplete");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "8");
  url.searchParams.set("format", "json");
  if (opts.tag) url.searchParams.set("tag", opts.tag);
  if (opts.near) {
    // Biases ranking toward this point rather than restricting to it, so
    // "browsing an area" narrows results without hiding a gym just outside it.
    url.searchParams.set("lat", String(opts.near.lat));
    url.searchParams.set("lon", String(opts.near.lon));
  }

  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) return [];
  return mapResults(await res.json());
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const nearLat = Number(request.nextUrl.searchParams.get("lat"));
  const nearLon = Number(request.nextUrl.searchParams.get("lon"));
  const near = Number.isFinite(nearLat) && Number.isFinite(nearLon) && request.nextUrl.searchParams.has("lat") ? { lat: nearLat, lon: nearLon } : null;

  // This calls a paid third-party API per request — require login (this
  // route previously had no auth check at all) and cap how often any one
  // user can call it, so it can't be scripted into an unbounded LocationIQ
  // bill.
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

  const apiKey = process.env.LOCATIONIQ_API_KEY;
  if (!apiKey) return NextResponse.json({ results: [] });

  try {
    const tagged = await searchLocationIq(q, apiKey, { tag: GYM_TAGS, near });

    // Real-world gym chains (PureGym, The Gym Group, Anytime Fitness, ...)
    // are tagged inconsistently across individual OSM locations — plenty
    // are missing a `leisure=fitness_centre` tag entirely, so a tag-only
    // search silently drops well-known brands. Only spend a second
    // LocationIQ call when the precise pass came up thin, and merge in
    // whatever it finds that the first pass didn't already return.
    let results = tagged;
    if (tagged.length < 3) {
      const untagged = await searchLocationIq(q, apiKey, { near });
      const seen = new Set(tagged.map((r) => r.placeId));
      results = [...tagged, ...untagged.filter((r) => !seen.has(r.placeId))];
    }

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
