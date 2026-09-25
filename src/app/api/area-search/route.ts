import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

type LocationIqResult = {
  display_place?: string;
  display_name?: string;
  display_address?: string;
  lat?: string;
  lon?: string;
};

// General place search (cities, neighborhoods, landmarks) so the Gyms page
// can jump to a different area to browse — deliberately no gym/leisure tag
// filter here, unlike /api/gym-search, since the whole point is resolving
// places that aren't gyms themselves.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const withinLimit = await checkRateLimit({
    userId: user.id,
    bucket: "area-search",
    windowSeconds: 60,
    maxRequests: 30,
  });
  if (!withinLimit) {
    return NextResponse.json({ error: "Too many searches — try again in a minute." }, { status: 429 });
  }

  const apiKey = process.env.LOCATIONIQ_API_KEY;
  if (!apiKey) return NextResponse.json({ results: [] });

  const url = new URL("https://api.locationiq.com/v1/autocomplete");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "6");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) return NextResponse.json({ results: [] });

    const data: LocationIqResult[] = await res.json();
    const results = (Array.isArray(data) ? data : [])
      .map((r) => ({
        label: r.display_place ?? r.display_name?.split(",")[0] ?? "Place",
        address: r.display_address ?? r.display_name ?? null,
        lat: r.lat ? Number(r.lat) : null,
        lng: r.lon ? Number(r.lon) : null,
      }))
      .filter((r): r is { label: string; address: string | null; lat: number; lng: number } => r.lat != null && r.lng != null);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
