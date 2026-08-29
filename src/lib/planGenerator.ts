import type { Exercise } from "@/types/database";

export type Goal = "muscle" | "strength";
export type Focus = "full" | "upper" | "lower";

const FOCUS_CATEGORIES: Record<Focus, string[]> = {
  full: ["chest", "back", "legs", "shoulders", "arms", "core"],
  upper: ["chest", "back", "shoulders", "arms", "core"],
  lower: ["legs", "core"],
};

// how many exercises to pull from each category, per goal
const SLOTS_PER_CATEGORY: Record<Goal, Record<string, number>> = {
  strength: { chest: 1, back: 1, legs: 2, shoulders: 1, arms: 0, core: 1 },
  muscle: { chest: 2, back: 2, legs: 2, shoulders: 1, arms: 2, core: 1 },
};

const GOAL_SCHEME: Record<Goal, { targetSets: number; targetReps: number }> = {
  strength: { targetSets: 5, targetReps: 5 },
  muscle: { targetSets: 3, targetReps: 10 },
};

const EQUIPMENT_PRIORITY: Record<Goal, string[]> = {
  strength: ["barbell", "machine", "dumbbell", "bodyweight"],
  muscle: ["dumbbell", "machine", "barbell", "bodyweight"],
};

function pickFromCategory(pool: Exercise[], category: string, count: number, goal: Goal, used: Set<string>) {
  const candidates = pool
    .filter((e) => e.category === category && !used.has(e.id))
    .sort((a, b) => {
      const pa = EQUIPMENT_PRIORITY[goal].indexOf(a.equipment ?? "");
      const pb = EQUIPMENT_PRIORITY[goal].indexOf(b.equipment ?? "");
      return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
    });

  const picked = candidates.slice(0, count);
  picked.forEach((e) => used.add(e.id));
  return picked;
}

export type GeneratedExercise = {
  exerciseId: string;
  name: string;
  equipment: string | null;
  category: string | null;
  targetSets: number;
  targetReps: number;
};

export function generatePlan(
  exercises: Exercise[],
  goal: Goal,
  focus: Focus
): { name: string; exercises: GeneratedExercise[] } {
  const categories = FOCUS_CATEGORIES[focus];
  const slots = SLOTS_PER_CATEGORY[goal];
  const scheme = GOAL_SCHEME[goal];
  const used = new Set<string>();

  const picked: Exercise[] = [];
  for (const category of categories) {
    const count = slots[category] ?? 0;
    if (count > 0) picked.push(...pickFromCategory(exercises, category, count, goal, used));
  }

  const goalLabel = goal === "strength" ? "Strength" : "Muscle";
  const focusLabel = focus === "full" ? "Full Body" : focus === "upper" ? "Upper Body" : "Lower Body";

  return {
    name: `${focusLabel} ${goalLabel}`,
    exercises: picked.map((e) => ({
      exerciseId: e.id,
      name: e.name,
      equipment: e.equipment,
      category: e.category,
      targetSets: scheme.targetSets,
      targetReps: scheme.targetReps,
    })),
  };
}
