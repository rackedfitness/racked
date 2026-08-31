export type WorkoutSetLite = {
  weight: number | null;
  reps: number | null;
  is_warmup: boolean;
};

export type WorkoutExerciseLite = {
  exercise_id: string;
  workout_sets: WorkoutSetLite[];
};

export type WorkoutLite = {
  id: string;
  title: string;
  notes?: string | null;
  started_at: string;
  finished_at: string | null;
  workout_exercises: WorkoutExerciseLite[];
};

type ExerciseCategoryRef = { category: string | null } | { category: string | null }[] | null;

export type CategorySetsWorkoutExercise = {
  workout_sets: { is_warmup: boolean }[];
  exercises: ExerciseCategoryRef;
};

// Counts working (non-warmup) sets per exercise category, the same volume
// signal Hevy-style muscle heatmaps use to grade how hard a muscle was hit.
export function categorySetCounts(
  workouts: { workout_exercises: CategorySetsWorkoutExercise[] }[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const w of workouts) {
    for (const we of w.workout_exercises ?? []) {
      const info = Array.isArray(we.exercises) ? we.exercises[0] : we.exercises;
      const category = info?.category;
      if (!category) continue;
      const workingSets = (we.workout_sets ?? []).filter((s) => !s.is_warmup).length;
      counts[category] = (counts[category] ?? 0) + workingSets;
    }
  }
  return counts;
}

// Epley formula: a standard estimate of 1-rep max from a submaximal set.
export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  return weight * (1 + reps / 30);
}

export function workoutVolume(workout: WorkoutLite): number {
  let total = 0;
  for (const we of workout.workout_exercises) {
    for (const s of we.workout_sets) {
      if (s.weight && s.reps) total += s.weight * s.reps;
    }
  }
  return total;
}

export function workoutBestSetPerExercise(
  workout: WorkoutLite
): Map<string, { weight: number; reps: number; est1RM: number }> {
  const best = new Map<string, { weight: number; reps: number; est1RM: number }>();
  for (const we of workout.workout_exercises) {
    for (const s of we.workout_sets) {
      if (!s.weight || !s.reps) continue;
      const est1RM = estimateOneRepMax(s.weight, s.reps);
      const current = best.get(we.exercise_id);
      if (!current || est1RM > current.est1RM) {
        best.set(we.exercise_id, { weight: s.weight, reps: s.reps, est1RM });
      }
    }
  }
  return best;
}

/**
 * Walks workouts oldest-first and flags a PR whenever a workout's best set for
 * an exercise beats every earlier workout's best set for that same exercise.
 */
export function attachPRCounts<T extends WorkoutLite>(
  workouts: T[]
): Array<T & { prCount: number; volume: number }> {
  const chronological = [...workouts].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  );

  const bestEver = new Map<string, number>(); // exerciseId -> best est1RM so far
  const results = new Map<string, number>(); // workoutId -> prCount

  for (const w of chronological) {
    const bestThisWorkout = workoutBestSetPerExercise(w);
    let prCount = 0;
    for (const [exerciseId, best] of bestThisWorkout) {
      const prior = bestEver.get(exerciseId) ?? 0;
      if (best.est1RM > prior) {
        prCount++;
        bestEver.set(exerciseId, best.est1RM);
      }
    }
    results.set(w.id, prCount);
  }

  return workouts.map((w) => ({ ...w, prCount: results.get(w.id) ?? 0, volume: workoutVolume(w) }));
}

export function computeStreakDays(workouts: { started_at: string }[]): number {
  const days = new Set(workouts.map((w) => new Date(w.started_at).toDateString()));
  const cursor = new Date();

  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeLongestStreakDays(workouts: { started_at: string }[]): number {
  const dayTimestamps = [...new Set(workouts.map((w) => new Date(w.started_at).toDateString()))]
    .map((d) => new Date(d).getTime())
    .sort((a, b) => a - b);

  if (dayTimestamps.length === 0) return 0;

  const ONE_DAY = 24 * 60 * 60 * 1000;
  let longest = 1;
  let current = 1;

  for (let i = 1; i < dayTimestamps.length; i++) {
    if (dayTimestamps[i] - dayTimestamps[i - 1] === ONE_DAY) {
      current++;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
  }

  return longest;
}

export function formatVolume(volume: number): string {
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)} tons`;
  return `${Math.round(volume)}kg`;
}

// Coarser than formatDuration below (minutes only, no seconds) — for
// summarizing a whole finished workout rather than a live-ticking timer.
export function formatWorkoutDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

/**
 * The weight of the most recently logged set per exercise, across all
 * finished workouts. Assumes each workout_exercises[].workout_sets array is
 * already ordered by set_index (i.e. the last element is the last set logged).
 */
export function computeLastWeightMap(workouts: WorkoutLite[]): Record<string, number> {
  const mostRecentFirst = [...workouts].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );

  const result: Record<string, number> = {};

  for (const w of mostRecentFirst) {
    for (const we of w.workout_exercises) {
      if (result[we.exercise_id] !== undefined) continue;
      for (let i = we.workout_sets.length - 1; i >= 0; i--) {
        const weight = we.workout_sets[i].weight;
        if (weight) {
          result[we.exercise_id] = weight;
          break;
        }
      }
    }
  }

  return result;
}

/** All-time best estimated 1RM per exercise, across every finished workout. */
export function computeBestEverMap(workouts: WorkoutLite[]): Record<string, number> {
  const bestEver: Record<string, number> = {};
  for (const w of workouts) {
    const best = workoutBestSetPerExercise(w);
    for (const [exerciseId, b] of best) {
      if (!bestEver[exerciseId] || b.est1RM > bestEver[exerciseId]) {
        bestEver[exerciseId] = b.est1RM;
      }
    }
  }
  return bestEver;
}

export type PREvent = {
  workoutId: string;
  exerciseId: string;
  startedAt: string;
  weight: number;
  reps: number;
  est1RM: number;
};

/**
 * Walks workouts oldest-first and records every moment a new all-time best
 * (by estimated 1RM) was set for an exercise.
 */
export function computePREvents(workouts: WorkoutLite[]): PREvent[] {
  const chronological = [...workouts].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  );

  const bestEver = new Map<string, number>();
  const events: PREvent[] = [];

  for (const w of chronological) {
    const bestThisWorkout = workoutBestSetPerExercise(w);
    for (const [exerciseId, best] of bestThisWorkout) {
      const prior = bestEver.get(exerciseId) ?? 0;
      if (best.est1RM > prior) {
        bestEver.set(exerciseId, best.est1RM);
        events.push({
          workoutId: w.id,
          exerciseId,
          startedAt: w.started_at,
          weight: best.weight,
          reps: best.reps,
          est1RM: best.est1RM,
        });
      }
    }
  }

  return events;
}

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

export function nextStreakMilestone(streak: number): number | null {
  return STREAK_MILESTONES.find((m) => m > streak) ?? null;
}
