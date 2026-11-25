import confetti from "canvas-confetti";

// Screen-level "juice" for the PR and rank-up moments. Everything here is
// purely visual/haptic, client-only, and bails out under prefers-reduced-motion.

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

function accentColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ccff00";
}

// A simple medal glyph (ribbon flags + disc) for PR-celebration confetti.
// canvas-confetti's shapeFromPath needs a browser Path2D, so it's built lazily
// on first use (never at module scope, which would also run during SSR) and
// cached since computing the transform matrix is relatively expensive.
const MEDAL_PATH = "M14,2 L20,2 L20,14 Z M26,2 L20,2 L20,14 Z M11,24 A9,9 0 1,0 29,24 A9,9 0 1,0 11,24 Z";
let medalShapeCache: ReturnType<typeof confetti.shapeFromPath> | null = null;
function getMedalShape() {
  if (!medalShapeCache) {
    medalShapeCache = confetti.shapeFromPath({ path: MEDAL_PATH });
  }
  return medalShapeCache;
}

let shakeTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Shakes the whole screen (page content + bottom nav) with a decaying jolt.
 * The motion itself is CSS (.screen-shaking in globals.css); this just sets the
 * strength and restarts it if one is already running.
 */
export function shakeScreen({
  amplitude,
  durationMs,
  vibrate,
}: {
  amplitude: number;
  durationMs: number;
  vibrate?: number | number[];
}) {
  if (typeof document === "undefined") return;
  if (vibrate) navigator.vibrate?.(vibrate);
  if (prefersReducedMotion()) return;

  const body = document.body;
  body.style.setProperty("--shake-amp", `${amplitude}px`);
  body.style.setProperty("--shake-dur", `${durationMs}ms`);
  body.classList.remove("screen-shaking");
  void body.offsetWidth; // force a reflow so the animation restarts from zero
  body.classList.add("screen-shaking");

  if (shakeTimer) clearTimeout(shakeTimer);
  shakeTimer = setTimeout(() => body.classList.remove("screen-shaking"), durationMs + 50);
}

/**
 * Starts a continuous side-to-side shake of the whole screen (page content +
 * bottom nav) and returns a function that stops it. Unlike shakeScreen this
 * doesn't decay or time out — the caller owns when it ends.
 */
export function startShakeLoop(amplitude: number): () => void {
  if (typeof document === "undefined") return () => {};
  const body = document.body;
  body.style.setProperty("--shake-loop-amp", `${amplitude}px`);
  body.classList.add("screen-shaking-loop");
  return () => body.classList.remove("screen-shaking-loop");
}

/** A full-screen color flash that fades out — the "camera flash" on impact. */
export function flashScreen(color: string, peakOpacity: number, durationMs = 380) {
  if (typeof document === "undefined" || prefersReducedMotion()) return;
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, {
    position: "fixed",
    inset: "0",
    zIndex: "60",
    pointerEvents: "none",
    background: color,
    opacity: "0",
  });
  document.body.appendChild(el);
  const anim = el.animate(
    [{ opacity: 0 }, { opacity: peakOpacity, offset: 0.12 }, { opacity: 0 }],
    { duration: durationMs, easing: "ease-out" }
  );
  anim.onfinish = () => el.remove();
}

/** Expanding rings radiating out from a point, like a shockwave. */
export function shockwave(x: number, y: number, color: string, { size = 520, rings = 2, durationMs = 700 } = {}) {
  if (typeof document === "undefined" || prefersReducedMotion()) return;
  for (let i = 0; i < rings; i++) {
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    Object.assign(el.style, {
      position: "fixed",
      left: `${x - size / 2}px`,
      top: `${y - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      border: `${6 - i}px solid ${color}`,
      boxShadow: `0 0 40px ${color}, inset 0 0 40px ${color}`,
      zIndex: "60",
      pointerEvents: "none",
      opacity: "0",
    });
    document.body.appendChild(el);
    const anim = el.animate(
      [
        { transform: "scale(0.08)", opacity: 0.95 },
        { transform: "scale(1.25)", opacity: 0 },
      ],
      { duration: durationMs, delay: i * 130, easing: "cubic-bezier(0.1, 0.7, 0.3, 1)", fill: "both" }
    );
    anim.onfinish = () => el.remove();
  }
}

/**
 * The full new-PR hit: flash, shockwave from the set row, a firm shake + haptic,
 * and a layered confetti blast (medals up the middle, cannons from both sides,
 * a delayed shower of stars).
 */
export function celebratePR(rowEl: Element | null) {
  const accent = accentColor();
  const rect = rowEl?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

  flashScreen(accent, 0.3, 360);
  shockwave(x, y, accent, { size: Math.min(window.innerWidth, 560), rings: 2 });
  shakeScreen({ amplitude: 7, durationMs: 460, vibrate: [30, 30, 70] });

  const colors = [accent, "#ffffff", accent];
  const common = { disableForReducedMotion: true, colors } as const;

  confetti({
    ...common,
    particleCount: 70,
    spread: 80,
    startVelocity: 52,
    origin: { y: 0.62 },
    ticks: 190,
    scalar: 1.25,
    shapes: [getMedalShape()],
  });
  confetti({ ...common, particleCount: 55, angle: 60, spread: 55, startVelocity: 62, origin: { x: 0, y: 0.8 }, ticks: 200 });
  confetti({ ...common, particleCount: 55, angle: 120, spread: 55, startVelocity: 62, origin: { x: 1, y: 0.8 }, ticks: 200 });
  setTimeout(() => {
    confetti({
      ...common,
      particleCount: 40,
      spread: 360,
      startVelocity: 22,
      gravity: 0.6,
      origin: { y: 0.45 },
      shapes: ["star"],
      ticks: 220,
      scalar: 1.1,
    });
  }, 220);
}

/** The rank-up landing beat: bigger flash, three shockwaves, a heavy shake. */
export function celebrateRankUp(color: string) {
  flashScreen(color, 0.6, 520);
  shockwave(window.innerWidth / 2, window.innerHeight / 2 - 30, color, {
    size: Math.min(window.innerWidth * 1.1, 640),
    rings: 3,
    durationMs: 850,
  });
  shakeScreen({ amplitude: 18, durationMs: 950, vibrate: [60, 40, 120, 40, 60] });

  const colors = [color, "#ffffff", color];
  const common = { disableForReducedMotion: true, colors } as const;

  confetti({ ...common, particleCount: 120, spread: 100, startVelocity: 58, origin: { y: 0.5 }, ticks: 220, shapes: ["star", "circle"] });
  confetti({ ...common, particleCount: 70, angle: 55, spread: 60, startVelocity: 70, origin: { x: 0, y: 0.9 }, ticks: 240 });
  confetti({ ...common, particleCount: 70, angle: 125, spread: 60, startVelocity: 70, origin: { x: 1, y: 0.9 }, ticks: 240 });
  setTimeout(() => {
    confetti({ ...common, particleCount: 60, spread: 360, startVelocity: 26, gravity: 0.55, origin: { y: 0.4 }, shapes: ["star"], ticks: 260 });
  }, 300);
}
