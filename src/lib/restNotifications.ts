import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

// Fixed id: scheduling again with the same id implicitly replaces any
// pending one, so there's never more than one rest notification in flight
// regardless of how many exercises/sets a session has.
const REST_NOTIFICATION_ID = 90210;

// Fires while the app is backgrounded (the in-app sound only covers the
// foreground case) — a no-op on web, since Capacitor.isNativePlatform() is
// false there. Never throws: a native notification is a nice-to-have, not
// something that should block or error out the rest timer itself.
export async function scheduleRestCompleteNotification(secondsFromNow: number, exerciseName: string) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== "granted") {
      const { display: requested } = await LocalNotifications.requestPermissions();
      if (requested !== "granted") return;
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REST_NOTIFICATION_ID,
          title: "Rest complete",
          body: `Time for your next set${exerciseName ? ` — ${exerciseName}` : ""}.`,
          schedule: { at: new Date(Date.now() + secondsFromNow * 1000) },
        },
      ],
    });
  } catch {
    // non-fatal — see comment above
  }
}

export async function cancelRestCompleteNotification() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REST_NOTIFICATION_ID }] });
  } catch {
    // non-fatal
  }
}
