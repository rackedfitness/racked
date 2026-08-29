import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";

export default async function FeedPage() {
  const supabase = await createClient();

  const { data: workouts } = await supabase
    .from("workouts")
    .select(
      "id, title, notes, started_at, user_id, profiles(username, display_name, avatar_url), workout_exercises(count)"
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

      <div className="flex flex-col gap-3">
        {(workouts ?? []).map((w) => {
          const author = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles;
          const exerciseCount = Array.isArray(w.workout_exercises)
            ? (w.workout_exercises[0] as { count: number } | undefined)?.count ?? 0
            : 0;

          return (
            <Link
              key={w.id}
              href={`/workout/${w.id}`}
              className="rounded-lg border border-card-border bg-card p-4 hover:border-accent"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-muted">
                  <Avatar url={author?.avatar_url} name={author?.display_name ?? author?.username ?? "?"} size="sm" />
                  {author?.display_name ?? author?.username}
                </span>
                <span className="text-xs text-muted">
                  {new Date(w.started_at).toLocaleDateString()}
                </span>
              </div>
              <h2 className="mt-1 font-semibold">{w.title}</h2>
              <p className="text-sm text-muted">{exerciseCount} exercises</p>
              {w.notes && <p className="mt-1 text-sm italic text-muted">&ldquo;{w.notes}&rdquo;</p>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
