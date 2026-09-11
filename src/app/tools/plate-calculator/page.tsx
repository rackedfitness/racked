import Link from "next/link";
import { getWeightUnit } from "@/lib/supabase/server";
import { ArrowLeftIcon } from "@/components/UIIcons";
import PlateCalculator from "@/components/PlateCalculator";

export default async function PlateCalculatorPage() {
  const weightUnit = await getWeightUnit();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-bold">Plate calculator</h1>
      </div>

      <PlateCalculator defaultUnit={weightUnit} />
    </div>
  );
}
