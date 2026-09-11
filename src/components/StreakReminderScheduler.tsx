"use client";

import { useEffect } from "react";

// Renders nothing — just (re)schedules or cancels today's streak-loss local
// notification whenever the home page loads. Dynamically imported so the
// Capacitor packages never ship to web visitors (they no-op there anyway).
export default function StreakReminderScheduler({
  streak,
  hasLoggedToday,
}: {
  streak: number;
  hasLoggedToday: boolean;
}) {
  useEffect(() => {
    (async () => {
      const { scheduleStreakReminder, cancelStreakReminder } = await import("@/lib/streakReminder");
      if (streak > 0 && !hasLoggedToday) {
        await scheduleStreakReminder(streak);
      } else {
        await cancelStreakReminder();
      }
    })();
  }, [streak, hasLoggedToday]);

  return null;
}
