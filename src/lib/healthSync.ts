import { Capacitor } from "@capacitor/core";
import { Health } from "@flomentumsolutions/capacitor-health-extended";

// Syncs a finished workout to Apple Health (iOS) / Health Connect (Android)
// when running inside the native Capacitor app. No-op on the web — this same
// code serves the Vercel-hosted site directly, where there's no health store
// to write to. Never throws: a sync failure shouldn't block or error out an
// otherwise-successful workout save.
export async function syncWorkoutToHealth({
  startedAt,
  finishedAt,
  caloriesBurned,
}: {
  startedAt: string;
  finishedAt: string;
  caloriesBurned: number;
}) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await Health.requestHealthPermissions({
      permissions: ["WRITE_WORKOUTS", "WRITE_ACTIVE_CALORIES"],
    });
    await Health.saveWorkout({
      activityType: "strength-training",
      startDate: startedAt,
      endDate: finishedAt,
      calories: caloriesBurned > 0 ? caloriesBurned : undefined,
    });
  } catch (err) {
    console.warn("Health sync failed:", err);
  }
}
