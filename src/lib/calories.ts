// Active-energy estimate for cardio sets, using the standard MET-hour
// formula (calories = MET x bodyweight(kg) x duration(hours)) — the same
// baseline calculation Apple Health/Fitness and most fitness trackers use
// for active energy. MET values are approximate, sourced from the
// Compendium of Physical Activities; running/walking use a speed-based MET
// (calorie burn varies hugely with pace) since we already track distance
// and duration for those, everything else uses a flat moderate-effort MET.

type CardioMET = {
  fixed: number;
  fromSpeedKmh?: (kmh: number) => number;
};

function runningMET(kmh: number): number {
  const mph = kmh / 1.60934;
  if (mph < 5) return 6.0;
  if (mph < 5.2) return 8.3;
  if (mph < 6) return 9.0;
  if (mph < 6.7) return 9.8;
  if (mph < 7) return 10.5;
  if (mph < 7.5) return 11.0;
  if (mph < 8) return 11.8;
  if (mph < 8.6) return 12.3;
  if (mph < 9) return 12.8;
  if (mph < 10) return 14.5;
  if (mph < 11) return 16.0;
  return 18.0;
}

function walkingMET(kmh: number): number {
  const mph = kmh / 1.60934;
  if (mph < 2.0) return 2.0;
  if (mph < 2.5) return 2.8;
  if (mph < 3.0) return 3.0;
  if (mph < 3.5) return 3.5;
  if (mph < 4.0) return 4.3;
  if (mph < 4.5) return 5.0;
  return 6.3;
}

const CARDIO_METS: Record<string, CardioMET> = {
  running: { fixed: 9.8, fromSpeedKmh: runningMET },
  walking: { fixed: 3.5, fromSpeedKmh: walkingMET },
  "interval walking": { fixed: 6.0 },
  cycling: { fixed: 7.5 },
  "rowing machine": { fixed: 7.0 },
  "jump rope": { fixed: 11.0 },
  "assault bike": { fixed: 8.5 },
  "stair climber": { fixed: 9.0 },
  burpee: { fixed: 8.0 },
  elliptical: { fixed: 5.0 },
};

export function metForCardioExercise(exerciseName: string, distanceKm: number | null, durationSeconds: number | null): number | null {
  const def = CARDIO_METS[exerciseName.trim().toLowerCase()];
  if (!def) return null;

  if (def.fromSpeedKmh && distanceKm && durationSeconds) {
    const hours = durationSeconds / 3600;
    const kmh = distanceKm / hours;
    if (kmh > 0 && Number.isFinite(kmh)) return def.fromSpeedKmh(kmh);
  }

  return def.fixed;
}

export function estimateCaloriesForCardioSet({
  exerciseName,
  distanceKm,
  durationSeconds,
  bodyweightKg,
}: {
  exerciseName: string;
  distanceKm: number | null;
  durationSeconds: number | null;
  bodyweightKg: number | null;
}): number {
  if (!durationSeconds || !bodyweightKg) return 0;
  const met = metForCardioExercise(exerciseName, distanceKm, durationSeconds);
  if (!met) return 0;
  return met * bodyweightKg * (durationSeconds / 3600);
}
