import Link from "next/link";
import { notFound } from "next/navigation";
import { getGymReviews } from "@/app/gyms/actions";
import { gymTagLabel, gymTagEmoji } from "@/lib/gymTags";
import GymMap from "@/components/GymMapClient";
import StarRating from "@/components/StarRating";
import GymReviewForm from "@/components/GymReviewForm";
import Avatar from "@/components/Avatar";
import { ArrowLeftIcon } from "@/components/UIIcons";

export default async function GymDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ placeId?: string; name?: string; address?: string; lat?: string; lng?: string }>;
}) {
  const { placeId, name, address, lat, lng } = await searchParams;
  if (!placeId || !name) notFound();

  const { reviews, myReviewId } = await getGymReviews(placeId);
  const myReview = reviews.find((r) => r.id === myReviewId) ?? null;
  const otherReviews = reviews.filter((r) => r.id !== myReviewId);

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const tagCounts = new Map<string, number>();
  for (const r of reviews) {
    for (const t of r.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const sortedTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);

  const gymLat = lat ? Number(lat) : null;
  const gymLng = lng ? Number(lng) : null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/gyms" className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">{name}</h1>
          {address && <p className="truncate text-sm text-muted">{address}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-card-border bg-card p-3">
        <StarRating value={avgRating} size={22} />
        <span className="tnum text-sm text-muted">
          {reviews.length > 0 ? `${avgRating.toFixed(1)} · ${reviews.length} review${reviews.length === 1 ? "" : "s"}` : "No reviews yet"}
        </span>
      </div>

      {sortedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sortedTags.map(([tag, count]) => (
            <span key={tag} className="rounded-full border border-card-border px-2.5 py-1 text-xs text-muted">
              {gymTagEmoji(tag)} {gymTagLabel(tag)} · {count}
            </span>
          ))}
        </div>
      )}

      {gymLat != null && gymLng != null && (
        <div className="h-48 overflow-hidden rounded-lg border border-card-border">
          <GymMap
            pins={[{ placeId, name, lat: gymLat, lng: gymLng, avgRating: avgRating || 5, reviewCount: reviews.length }]}
            center={{ lat: gymLat, lng: gymLng }}
            zoom={15}
          />
        </div>
      )}

      <GymReviewForm placeId={placeId} gymName={name} gymAddress={address ?? null} lat={gymLat} lng={gymLng} myReview={myReview} />

      {otherReviews.length > 0 && (
        <div>
          <h2 className="mb-2 font-semibold">Reviews</h2>
          <div className="flex flex-col gap-3">
            {otherReviews.map((r) => (
              <div key={r.id} className="flex flex-col gap-1.5 rounded-lg border border-card-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Avatar url={r.profiles?.avatar_url ?? null} name={r.profiles?.display_name ?? r.profiles?.username ?? "?"} size="sm" />
                    {r.profiles?.display_name ?? r.profiles?.username ?? "Someone"}
                  </span>
                  <StarRating value={r.rating} size={14} />
                </div>
                {r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.tags.map((t) => (
                      <span key={t} className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                        {gymTagEmoji(t)} {gymTagLabel(t)}
                      </span>
                    ))}
                  </div>
                )}
                {r.body && <p className="text-sm text-muted">{r.body}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
