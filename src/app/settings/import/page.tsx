import Link from "next/link";
import { getWeightUnit } from "@/lib/supabase/server";
import { ArrowLeftIcon } from "@/components/UIIcons";
import ImportCsvForm from "@/components/ImportCsvForm";

export default async function ImportWorkoutsPage() {
  const weightUnit = await getWeightUnit();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-bold">Import workouts</h1>
      </div>

      <p className="text-sm text-muted">
        Bring your history over from Strong or Hevy. Export a CSV from that app (usually Settings → Export Data),
        then upload it here. CSV formats vary a bit between app versions, so double-check your imported history
        afterward.
      </p>

      <ImportCsvForm defaultUnit={weightUnit} />
    </div>
  );
}
