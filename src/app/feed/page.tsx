import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";

export default async function FeedPage() {
  const supabase = await createClient();

  const { data: workouts } = await supabase
    .from("workouts")
    .select(
      "id, title, notes, photo_url, started_at, user_id, profiles(username, display_name, avatar_url), workout_exercises(count)"
    )
    .not("finished_at", "is", null)
    .eq("is_public", true)
    .order("started_at", { ascending: false })
    .limit(30);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Feed</h1>
        <Link
          href="/workout/new"
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink"
        >
          Log workout
        </Link>
      </div>

      {(!workouts || workouts.length === 0) && (
        <div className="rounded-lg border border-dashed border-card-border p-6 text-center text-sm text-muted">
          No workouts yet. Log one, or{" "}
          <Link href="/people" className="underline">
            find friends to follow
          </Link>
          .
        </div>
      )}

      <div className="flex flex-col gap-5">
        {(workouts ?? []).map((w) => {
          const author = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles;
          const exerciseCount = Array.isArray(w.workout_exercises)
            ? (w.workout_exercises[0] as { count: number } | undefined)?.count ?? 0
            : 0;

          return (
            <Link
              key={w.id}
              href={`/workout/${w.id}`}
              className="flex flex-col gap-3 rounded-xl border border-card-border bg-card p-5 hover:border-accent"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2.5 text-sm font-medium text-muted">
                  <Avatar url={author?.avatar_url} name={author?.display_name ?? author?.username ?? "?"} size="md" />
                  {author?.display_name ?? author?.username}
                </span>
                <span className="text-xs text-muted">
                  {new Date(w.started_at).toLocaleDateString()}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-semibold">{w.title}</h2>
                <p className="text-sm text-muted">{exerciseCount} exercises</p>
              </div>

              {w.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={w.photo_url}
                  alt=""
                  className="max-h-96 w-full rounded-lg border border-card-border object-cover"
                />
              )}

              {w.notes && <p className="text-sm italic text-muted">&ldquo;{w.notes}&rdquo;</p>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
