import type { CapacitorConfig } from "@capacitor/cli";

// Racked's Next.js app uses Server Actions and SSR throughout (auth, workout
// logging, feed, etc.), so it can't be statically exported into the native
// bundle. Instead the native shell just points its WebView at the deployed
// site — the Capacitor JS bridge (and plugins like HealthKit) still work
// against remote content, same as on a static bundle.
const config: CapacitorConfig = {
  // TODO: replace with your real reverse-DNS app id, matching the Bundle
  // Identifier you register for this app in the Apple Developer portal.
  appId: "com.rackedfitness.racked",
  appName: "Racked",
  webDir: "public",
  server: {
    url: "https://racked-xyao.vercel.app",
    cleartext: false,
  },
};

export default config;
