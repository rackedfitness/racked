export type PlateSet = { label: string; plates: number[]; barWeight: number };

export const PLATE_SETS: Record<"kg" | "lbs", PlateSet> = {
  kg: { label: "kg", plates: [25, 20, 15, 10, 5, 2.5, 1.25], barWeight: 20 },
  lbs: { label: "lbs", plates: [45, 35, 25, 10, 5, 2.5], barWeight: 45 },
};

export type PlateBreakdown = {
  perSide: number[];
  perSideWeight: number;
  loadedTotal: number;
  remainder: number;
};

// Greedily fills one side of the bar from the largest available plate down —
// assumes an unlimited supply of each plate, which is the common case for a
// commercial gym's fixed weight tree.
export function calculatePlates(targetWeight: number, barWeight: number, availablePlates: number[]): PlateBreakdown {
  const perSideTarget = (targetWeight - barWeight) / 2;
  if (perSideTarget <= 0) {
    return { perSide: [], perSideWeight: 0, loadedTotal: barWeight, remainder: targetWeight - barWeight };
  }

  const sorted = [...availablePlates].sort((a, b) => b - a);
  const perSide: number[] = [];
  let remaining = perSideTarget;

  for (const plate of sorted) {
    while (plate <= remaining + 1e-9) {
      perSide.push(plate);
      remaining -= plate;
    }
  }

  const perSideWeight = perSide.reduce((sum, p) => sum + p, 0);
  const loadedTotal = barWeight + perSideWeight * 2;
  return { perSide, perSideWeight, loadedTotal, remainder: Math.round(remaining * 100) / 100 };
}
