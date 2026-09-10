export type WeightUnit = "kg" | "lbs";

const KG_PER_LB = 0.45359237;

export function kgToLbs(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbsToKg(lbs: number): number {
  return lbs * KG_PER_LB;
}

// Everything is stored and computed internally in kg (PRs, ranks, calories,
// the DB itself) — these two are the only place unit preference should ever
// touch: converting a kg value for display, and converting a user-typed
// value back to kg before it's used anywhere else.
export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  const value = unit === "lbs" ? kgToLbs(kg) : kg;
  return Math.round(value * 10) / 10;
}

export function toKg(value: number, unit: WeightUnit): number {
  return unit === "lbs" ? lbsToKg(value) : value;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${toDisplayWeight(kg, unit)}${unit}`;
}
