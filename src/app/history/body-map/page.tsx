import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { categorySetCounts } from "@/lib/stats";
import BodyMap, { intensityColor } from "@/components/BodyMap";
import { ArrowLeftIcon, FlameIcon } from "@/components/UIIcons";

export default async function BodyMapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, workout_exercises(exercises(category), workout_sets(is_warmup))")
    .eq("user_id", user!.id)
    .not("finished_at", "is", null)
    .gte("started_at", sevenDaysAgo.toISOString());

  const counts = categorySetCounts(workouts ?? []);

  const sortedCategories = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  const labels: Record<string, string> = {
    chest: "Chest",
    back: "Back",
    legs: "Legs",
    shoulders: "Shoulders",
    arms: "Arms",
    core: "Core",
    cardio: "Cardio",
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/history" className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-bold">Body map</h1>
      </div>

      <BodyMap counts={counts} />

      <div>
        <h2 className="mb-2 flex items-center gap-1.5 font-semibold">
          <FlameIcon size={18} /> By muscle group
        </h2>
        <div className="flex flex-col gap-2">
          {sortedCategories.map(([category, count]) => (
            <div
              key={category}
              className="flex items-center justify-between rounded-lg border border-card-border bg-card p-3 text-sm"
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full border border-card-border"
                  style={{ background: intensityColor(count) }}
                />
                {labels[category] ?? category}
              </span>
              <span className="tnum text-muted">
                {count} set{count === 1 ? "" : "s"}
              </span>
            </div>
          ))}

          {sortedCategories.length === 0 && (
            <p className="text-sm text-muted">No workouts in the last 7 days.</p>
          )}
        </div>
      </div>
    </div>
  );
}
