import { NextRequest, NextResponse } from "next/server";

// Restricts results to places actually tagged as a gym/fitness facility in
// OpenStreetMap — without this, searching a common word ("gold") would surface
// any business with that name, not just gyms.
const GYM_TAGS = "leisure:fitness_centre,leisure:gym,leisure:sports_centre";

type LocationIqResult = {
  place_id?: string;
  display_place?: string;
  display_name?: string;
  display_address?: string;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const apiKey = process.env.LOCATIONIQ_API_KEY;
  if (!apiKey) return NextResponse.json({ results: [] });

  const url = new URL("https://api.locationiq.com/v1/autocomplete");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", q);
  url.searchParams.set("tag", GYM_TAGS);
  url.searchParams.set("limit", "8");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) return NextResponse.json({ results: [] });

    const data: LocationIqResult[] = await res.json();
    const results = (Array.isArray(data) ? data : []).map((r) => ({
      name: r.display_place ?? r.display_name?.split(",")[0] ?? "Gym",
      address: r.display_address ?? null,
      placeId: r.place_id ?? null,
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
