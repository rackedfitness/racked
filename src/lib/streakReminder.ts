import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

// Fixed id: rescheduling with the same id replaces any pending one, so
// re-running this on every app open never stacks up duplicate reminders.
const STREAK_REMINDER_ID = 90211;

const REMINDER_HOUR = 20; // 8pm local time

// Nudges the user before they lose an active streak — only ever scheduled
// for later today, never in the past, so opening the app after 8pm just
// skips today's reminder rather than firing one immediately. No-op on web
// and never throws, same as scheduleRestCompleteNotification.
export async function scheduleStreakReminder(streakDays: number) {
  if (!Capacitor.isNativePlatform() || streakDays <= 0) return;
  try {
    const at = new Date();
    at.setHours(REMINDER_HOUR, 0, 0, 0);
    if (at.getTime() <= Date.now()) return;

    const { display } = await LocalNotifications.checkPermissions();
    if (display !== "granted") {
      const { display: requested } = await LocalNotifications.requestPermissions();
      if (requested !== "granted") return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: STREAK_REMINDER_ID,
          title: "Don't lose your streak",
          body: `You're on a ${streakDays}-day streak — log a workout today to keep it going.`,
          schedule: { at },
        },
      ],
    });
  } catch {
    // non-fatal — a missed reminder shouldn't break anything else
  }
}

export async function cancelStreakReminder() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: STREAK_REMINDER_ID }] });
  } catch {
    // non-fatal
  }
}
