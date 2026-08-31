import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PlanNameField from "@/components/PlanNameField";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: templates } = await supabase
    .from("workout_templates")
    .select("id, name")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Workouts</h1>
        <Link
          href="/workout/new"
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink"
        >
          + New
        </Link>
      </div>

      <div className="flex gap-2">
        <Link
          href="/workout/new"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-accent py-3 text-sm font-bold uppercase tracking-wide text-accent"
        >
          ▶ Start empty
        </Link>
        <Link
          href="/workouts/generate"
          className="glow-accent flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-bold uppercase tracking-wide text-accent-ink"
        >
          ✨ Generate plan
        </Link>
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Your plans</h2>
        <div className="rounded-lg border border-card-border bg-card p-4">
          {templates && templates.length > 0 ? (
            <>
              <div className="flex flex-col gap-2">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-card-border p-3"
                  >
                    <PlanNameField templateId={t.id} name={t.name} />
                    <Link
                      href={`/workout/new?template=${t.id}`}
                      className="glow-accent-sm shrink-0 rounded-full bg-accent px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-accent-ink active:opacity-80"
                    >
                      ▶ Start
                    </Link>
                  </div>
                ))}
              </div>
              <Link
                href="/workout/new?savePlan=1"
                className="mt-3 block text-center text-sm text-muted active:text-accent"
              >
                + Build a plan manually
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <span className="text-2xl">🏋️</span>
              <p className="text-sm text-muted">No plans yet.</p>
              <Link
                href="/workout/new?savePlan=1"
                className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink"
              >
                Build a plan manually
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
