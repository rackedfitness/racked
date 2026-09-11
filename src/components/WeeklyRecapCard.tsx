import { formatVolume } from "@/lib/stats";
import type { WeightUnit } from "@/lib/units";

export default function WeeklyRecapCard({
  volumeThisWeekKg,
  volumeLastWeekKg,
  prCountThisWeek,
  weightUnit,
}: {
  volumeThisWeekKg: number;
  volumeLastWeekKg: number;
  prCountThisWeek: number;
  weightUnit: WeightUnit;
}) {
  const volumeDeltaPct =
    volumeLastWeekKg > 0 ? Math.round(((volumeThisWeekKg - volumeLastWeekKg) / volumeLastWeekKg) * 100) : null;

  return (
    <div className="rounded-lg border border-card-border bg-card p-4">
      <h2 className="mb-3 font-semibold">This week&rsquo;s recap</h2>
      <div className="tnum grid grid-cols-2 gap-2 text-center">
        <div>
          <p className="text-xl font-bold">{formatVolume(volumeThisWeekKg, weightUnit)}</p>
          <p className="text-xs text-muted">
            Volume
            {volumeDeltaPct !== null && (
              <span className={volumeDeltaPct >= 0 ? "text-green-500" : "text-red-500"}>
                {" "}
                ({volumeDeltaPct >= 0 ? "+" : ""}
                {volumeDeltaPct}% vs last wk)
              </span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xl font-bold">{prCountThisWeek}</p>
          <p className="text-xs text-muted">New PRs</p>
        </div>
      </div>
    </div>
  );
}
