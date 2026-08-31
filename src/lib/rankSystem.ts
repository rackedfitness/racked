import { workoutBestSetPerExercise, type WorkoutLite } from "@/lib/stats";

export type Sex = "male" | "female";
export type LiftKey =
  | "bench"
  | "inclineBench"
  | "squat"
  | "frontSquat"
  | "deadlift"
  | "romanianDeadlift"
  | "overheadPress"
  | "row"
  | "hipThrust"
  | "bicepCurl"
  | "hammerCurl"
  | "legPress"
  | "shoulderPress";

export type RankKey = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master" | "champion";

export type RankTier = {
  key: RankKey;
  label: string;
  minPercentile: number;
  color: string;
};

// Ordered lowest -> highest. minPercentile is the threshold a lifter must
// reach (percentile of the population at their bodyweight/age/sex) to hold
// that rank for a given lift.
export const RANK_TIERS: RankTier[] = [
  { key: "bronze", label: "Bronze", minPercentile: 0, color: "#a97142" },
  { key: "silver", label: "Silver", minPercentile: 20, color: "#b9c0c6" },
  { key: "gold", label: "Gold", minPercentile: 40, color: "#d4af37" },
  { key: "platinum", label: "Platinum", minPercentile: 60, color: "#3ddbb0" },
  { key: "diamond", label: "Diamond", minPercentile: 75, color: "#4f8ff0" },
  { key: "master", label: "Master", minPercentile: 90, color: "#b57bee" },
  { key: "champion", label: "Champion", minPercentile: 97, color: "#ef4444" },
];

export function rankForPercentile(percentile: number): RankTier {
  let best = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (percentile >= tier.minPercentile) best = tier;
  }
  return best;
}

// Exercise-name -> ranked lift. Only the "big compound" lifts have
// well-established population strength standards, so ranking is scoped to these.
const LIFT_NAME_MAP: Record<string, LiftKey> = {
  "bench press": "bench",
  "incline bench press": "inclineBench",
  "barbell squat": "squat",
  "front squat": "frontSquat",
  deadlift: "deadlift",
  "romanian deadlift": "romanianDeadlift",
  "overhead press": "overheadPress",
  "barbell row": "row",
  "hip thrust": "hipThrust",
  "bicep curl": "bicepCurl",
  "hammer curl": "hammerCurl",
  "leg press": "legPress",
  "seated dumbbell press": "shoulderPress",
};

export function liftKeyForExerciseName(name: string): LiftKey | null {
  return LIFT_NAME_MAP[name.trim().toLowerCase()] ?? null;
}

export const LIFT_LABELS: Record<LiftKey, string> = {
  bench: "Bench Press",
  inclineBench: "Incline Bench Press",
  squat: "Squat",
  frontSquat: "Front Squat",
  deadlift: "Deadlift",
  romanianDeadlift: "Romanian Deadlift",
  overheadPress: "Overhead Press",
  row: "Barbell Row",
  hipThrust: "Hip Thrust",
  bicepCurl: "Bicep Curl",
  hammerCurl: "Hammer Curl",
  legPress: "Leg Press",
  shoulderPress: "Shoulder Press",
};

// Reference points: estimated 1RM as a multiple of bodyweight, for a lifter
// in their strength-peak years (roughly 20-28yo), at each percentile.
// Sourced from general published strength-standard ranges (male baseline);
// female ratios are derived via a per-lift scaling factor. Incline bench,
// front squat, and Romanian deadlift are derived as a fraction of their
// "parent" lift's standards (the typical relationship between the two lifts
// for most trained lifters); row and hip thrust are estimated standalone.
const MALE_STANDARDS: Record<LiftKey, Record<number, number>> = {
  bench: { 5: 0.4, 20: 0.65, 50: 0.9, 80: 1.3, 95: 1.6, 99: 2.0 },
  inclineBench: { 5: 0.33, 20: 0.53, 50: 0.74, 80: 1.07, 95: 1.31, 99: 1.64 },
  squat: { 5: 0.5, 20: 0.85, 50: 1.2, 80: 1.7, 95: 2.1, 99: 2.5 },
  frontSquat: { 5: 0.41, 20: 0.7, 50: 0.98, 80: 1.39, 95: 1.72, 99: 2.05 },
  deadlift: { 5: 0.6, 20: 1.0, 50: 1.4, 80: 1.9, 95: 2.4, 99: 2.9 },
  romanianDeadlift: { 5: 0.47, 20: 0.78, 50: 1.09, 80: 1.48, 95: 1.87, 99: 2.26 },
  overheadPress: { 5: 0.25, 20: 0.4, 50: 0.55, 80: 0.8, 95: 1.0, 99: 1.2 },
  row: { 5: 0.34, 20: 0.55, 50: 0.77, 80: 1.11, 95: 1.36, 99: 1.7 },
  hipThrust: { 5: 0.7, 20: 1.1, 50: 1.5, 80: 2.1, 95: 2.6, 99: 3.1 },
  // Dumbbell lifts (bicep curl, hammer curl, shoulder press) are logged as
  // the weight of a single dumbbell, not the combined total.
  bicepCurl: { 5: 0.15, 20: 0.22, 50: 0.3, 80: 0.4, 95: 0.5, 99: 0.6 },
  hammerCurl: { 5: 0.17, 20: 0.24, 50: 0.33, 80: 0.44, 95: 0.55, 99: 0.66 },
  legPress: { 5: 0.8, 20: 1.4, 50: 2.0, 80: 2.8, 95: 3.5, 99: 4.2 },
  shoulderPress: { 5: 0.15, 20: 0.25, 50: 0.35, 80: 0.5, 95: 0.62, 99: 0.75 },
};

// Female standards run lower relative to bodyweight for upper-body pressing
// (less relative upper-body muscle mass) and closer to (or above) male for
// lower-body / hip-hinge lifts (smaller sex gap in leg/glute strength).
const FEMALE_SCALE: Record<LiftKey, number> = {
  bench: 0.55,
  inclineBench: 0.55,
  squat: 0.72,
  frontSquat: 0.72,
  deadlift: 0.68,
  romanianDeadlift: 0.68,
  overheadPress: 0.55,
  row: 0.6,
  hipThrust: 0.78,
  bicepCurl: 0.6,
  hammerCurl: 0.6,
  legPress: 0.75,
  shoulderPress: 0.55,
};

function standardsFor(lift: LiftKey, sex: Sex): Record<number, number> {
  const male = MALE_STANDARDS[lift];
  if (sex === "male") return male;
  const scale = FEMALE_SCALE[lift];
  return Object.fromEntries(Object.entries(male).map(([p, r]) => [p, r * scale]));
}

// Strength relative to bodyweight peaks roughly in the mid-20s and tapers off
// on either side; this is a simplified piecewise approximation (not a
// clinical model) used only to shift the standard curve up/down.
export function ageFactor(age: number): number {
  if (age <= 13) return 0.75;
  if (age < 18) return 0.75 + ((age - 13) / 5) * 0.25; // ramps 0.75 -> 1.0
  if (age <= 28) return 1.0;
  if (age <= 40) return 1.0 - (age - 28) * 0.005; // ~0.5%/yr
  if (age <= 60) return 0.94 - (age - 40) * 0.01; // ~1%/yr
  return Math.max(0.5, 0.74 - (age - 60) * 0.008);
}

/**
 * Estimates what percentile of the population (matched for bodyweight, age,
 * and sex) a given estimated 1RM falls into for a ranked lift, via
 * log-linear interpolation across reference strength-standard points.
 */
export function estimatePercentile({
  lift,
  oneRepMaxKg,
  bodyweightKg,
  age,
  sex,
}: {
  lift: LiftKey;
  oneRepMaxKg: number;
  bodyweightKg: number;
  age: number;
  sex: Sex;
}): number {
  if (bodyweightKg <= 0 || oneRepMaxKg <= 0) return 0;

  const factor = ageFactor(age);
  const base = standardsFor(lift, sex);
  const points = Object.entries(base)
    .map(([p, ratio]) => ({ percentile: Number(p), ratio: ratio * factor }))
    .sort((a, b) => a.percentile - b.percentile);

  const ratio = oneRepMaxKg / bodyweightKg;
  const logRatio = Math.log(ratio);

  if (ratio <= points[0].ratio) {
    // below the lowest reference point: scale down from percentile 1
    const next = points[1];
    const slope = (next.percentile - 1) / (Math.log(next.ratio) - Math.log(points[0].ratio * 0.5));
    const est = 1 + slope * (logRatio - Math.log(points[0].ratio * 0.5));
    return clamp(est, 1, points[0].percentile);
  }

  const last = points[points.length - 1];
  if (ratio >= last.ratio) {
    const prev = points[points.length - 2];
    const slope = (last.percentile - prev.percentile) / (Math.log(last.ratio) - Math.log(prev.ratio));
    const est = last.percentile + slope * (logRatio - Math.log(last.ratio));
    return clamp(est, last.percentile, 99.9);
  }

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (ratio >= a.ratio && ratio <= b.ratio) {
      const t = (logRatio - Math.log(a.ratio)) / (Math.log(b.ratio) - Math.log(a.ratio));
      return clamp(a.percentile + t * (b.percentile - a.percentile), 1, 99.9);
    }
  }

  return 50;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function computeLiftRank({
  lift,
  oneRepMaxKg,
  bodyweightKg,
  age,
  sex,
}: {
  lift: LiftKey;
  oneRepMaxKg: number;
  bodyweightKg: number;
  age: number;
  sex: Sex;
}): { percentile: number; rank: RankTier } {
  const percentile = estimatePercentile({ lift, oneRepMaxKg, bodyweightKg, age, sex });
  return { percentile, rank: rankForPercentile(percentile) };
}

export type LiftRankResult = {
  lift: LiftKey;
  label: string;
  oneRepMaxKg: number;
  percentile: number;
  rank: RankTier;
};

/**
 * Given a user's all-time best est1RM per exercise (keyed by exercise id) and
 * an id->name lookup, computes the rank for every ranked lift they have data for.
 */
export function computeAllLiftRanks({
  bestEver,
  exerciseNames,
  bodyweightKg,
  age,
  sex,
}: {
  bestEver: Record<string, number>;
  exerciseNames: Record<string, string>;
  bodyweightKg: number;
  age: number;
  sex: Sex;
}): LiftRankResult[] {
  const results: LiftRankResult[] = [];

  for (const [exerciseId, oneRepMaxKg] of Object.entries(bestEver)) {
    const name = exerciseNames[exerciseId];
    if (!name) continue;
    const lift = liftKeyForExerciseName(name);
    if (!lift) continue;

    const { percentile, rank } = computeLiftRank({ lift, oneRepMaxKg, bodyweightKg, age, sex });
    results.push({ lift, label: LIFT_LABELS[lift], oneRepMaxKg, percentile, rank });
  }

  return results.sort((a, b) => b.percentile - a.percentile);
}

export function bestOverallRank(results: LiftRankResult[]): LiftRankResult | null {
  if (results.length === 0) return null;
  return results[0];
}

export function formatTopPercent(percentile: number): string {
  const top = 100 - percentile;
  if (top < 1) return "<1%";
  return `${Math.round(top)}%`;
}

export type RankUpEvent = {
  workoutId: string;
  exerciseId: string;
  lift: LiftKey;
  label: string;
  startedAt: string;
  oneRepMaxKg: number;
  rank: RankTier;
};

/**
 * Walks a user's workouts oldest-first and records every moment a ranked
 * lift's tier (not just its raw e1RM) increased — e.g. Silver -> Gold. The
 * very first time a lift gets ranked at all counts as a rank-up too (there's
 * no tier below Bronze). Mirrors computePREvents in stats.ts, but at the
 * tier level rather than the raw-number level.
 */
export function computeRankUpEvents({
  workouts,
  exerciseNames,
  bodyweightKg,
  age,
  sex,
}: {
  workouts: WorkoutLite[];
  exerciseNames: Record<string, string>;
  bodyweightKg: number;
  age: number;
  sex: Sex;
}): RankUpEvent[] {
  const chronological = [...workouts].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  );

  const bestTierIndexByLift = new Map<LiftKey, number>();
  const events: RankUpEvent[] = [];

  for (const w of chronological) {
    const bestThisWorkout = workoutBestSetPerExercise(w);
    for (const [exerciseId, best] of bestThisWorkout) {
      const name = exerciseNames[exerciseId];
      if (!name) continue;
      const lift = liftKeyForExerciseName(name);
      if (!lift) continue;

      const { rank } = computeLiftRank({ lift, oneRepMaxKg: best.est1RM, bodyweightKg, age, sex });
      const newIndex = RANK_TIERS.findIndex((t) => t.key === rank.key);
      const priorIndex = bestTierIndexByLift.get(lift) ?? -1;

      if (newIndex > priorIndex) {
        events.push({
          workoutId: w.id,
          exerciseId,
          lift,
          label: LIFT_LABELS[lift],
          startedAt: w.started_at,
          oneRepMaxKg: best.est1RM,
          rank,
        });
        bestTierIndexByLift.set(lift, newIndex);
      }
    }
  }

  return events;
}
