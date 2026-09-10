import { createClient } from "@/lib/supabase/server";

// Fixed-window limiter backed by the increment_rate_limit() Postgres function
// (atomic upsert, so concurrent requests can't race past the limit the way a
// plain read-then-write from application code could). windowSeconds buckets
// requests into aligned time slices — e.g. 60 for "per minute", 86400 for
// "per day" — rather than a true sliding window, which is a deliberate
// simplification: good enough for abuse deterrence, not a billing meter.
export async function checkRateLimit({
  userId,
  bucket,
  windowSeconds,
  maxRequests,
}: {
  userId: string;
  bucket: string;
  windowSeconds: number;
  maxRequests: number;
}): Promise<boolean> {
  const supabase = await createClient();
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000).toISOString();

  const { data: count, error } = await supabase.rpc("increment_rate_limit", {
    p_user_id: userId,
    p_bucket: bucket,
    p_window_start: windowStart,
  });

  // Fail open: if the limiter itself errors (e.g. migration not applied
  // yet), don't take down the feature it's protecting over it.
  if (error) return true;

  return (count ?? 0) <= maxRequests;
}
