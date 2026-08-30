"use client";

import { useEffect, useState } from "react";
import { FlameIcon } from "@/components/UIIcons";
import { SnowflakeIcon } from "@/components/StreakIcons";
import { nextStreakMilestone } from "@/lib/stats";

const DEMO_MAX_STREAK = 380;

type Tier = {
  minStreak: number;
  color: string;
  glow: string;
  size: number;
  flicker: "none" | "soft" | "strong";
  pulse: boolean;
  mythic?: boolean;
  label: string;
};

// Escalating visual intensity the longer the streak runs — bigger, hotter,
// more animated flame the further up the list, mirroring the rank-tier
// pattern used elsewhere in the app (see rankSystem.ts / BodyMap intensity).
// Tier boundaries match STREAK_MILESTONES (stats.ts) exactly, so hitting a
// milestone is also the moment the flame visibly levels up. The color path
// runs hotter than real fire physics on purpose — ember -> orange -> red ->
// purple -> blue-white -> prismatic — a rarity ramp gamers/lifters read
// instantly as "max level", not a literal temperature chart.
const TIERS: Tier[] = [
  { minStreak: 1, color: "#ffb84d", glow: "#ffb84d", size: 28, flicker: "none", pulse: false, label: "Warming Up" },
  { minStreak: 3, color: "#ff8a3d", glow: "#ff8a3d", size: 34, flicker: "soft", pulse: false, label: "Heating Up" },
  { minStreak: 7, color: "#ff6a1a", glow: "#ff6a1a", size: 40, flicker: "soft", pulse: false, label: "On Fire" },
  { minStreak: 14, color: "#ff3d00", glow: "#ff7a00", size: 48, flicker: "strong", pulse: true, label: "Blazing" },
  { minStreak: 30, color: "#e0003c", glow: "#ff2d55", size: 56, flicker: "strong", pulse: true, label: "Inferno" },
  { minStreak: 60, color: "#c026ff", glow: "#ff29e0", size: 66, flicker: "strong", pulse: true, label: "Supernova" },
  { minStreak: 100, color: "#22c1ff", glow: "#eafcff", size: 78, flicker: "strong", pulse: true, label: "Legendary" },
  // A vivid (not white) base color so the hue-rotate shimmer below actually
  // has saturation to cycle through — white has none, so it'd barely move.
  {
    minStreak: 365,
    color: "#ff2ee0",
    glow: "#ffffff",
    size: 92,
    flicker: "strong",
    pulse: true,
    mythic: true,
    label: "Mythic",
  },
];

function tierFor(streak: number): Tier {
  let best = TIERS[0];
  for (const t of TIERS) if (streak >= t.minStreak) best = t;
  return best;
}

export default function StreakCard({
  streak: realStreak,
  longestStreak: realLongestStreak,
  milestone: realMilestone,
  demoMode = false,
}: {
  streak: number;
  longestStreak: number;
  milestone: number | null;
  // For filming/demo purposes only (e.g. ?demo=streak) — ticks the displayed
  // streak up by a day every second instead of showing the real value, so
  // every tier can be filmed in one continuous take. Never wired to real data.
  demoMode?: boolean;
}) {
  const [demoStreak, setDemoStreak] = useState(0);

  useEffect(() => {
    if (!demoMode) return;
    const interval = setInterval(() => {
      setDemoStreak((prev) => Math.min(DEMO_MAX_STREAK, prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [demoMode]);

  const streak = demoMode ? demoStreak : realStreak;
  const longestStreak = demoMode ? Math.max(demoStreak, 1) : realLongestStreak;
  const milestone = demoMode ? nextStreakMilestone(demoStreak) : realMilestone;

  const tier = streak > 0 ? tierFor(streak) : null;
  const progress = Math.min(100, (streak / Math.max(longestStreak, 1)) * 100);
  const flickerClass = tier?.mythic
    ? "animate-flame-mythic"
    : tier?.flicker === "strong"
      ? "animate-flame-flicker-strong"
      : tier?.flicker === "soft"
        ? "animate-flame-flicker"
        : "";

  return (
    <div
      className={`relative overflow-hidden rounded-lg border p-4 transition-colors ${
        tier?.pulse ? "animate-blaze-pulse" : ""
      }`}
      style={{
        borderColor: tier ? `${tier.color}55` : "var(--card-border)",
        background: tier ? `radial-gradient(circle at 15% 15%, ${tier.color}2e, var(--card) 68%)` : "var(--card)",
        ...(tier ? ({ "--blaze-glow": `${tier.glow}aa` } as React.CSSProperties) : {}),
      }}
    >
      <p className="text-[10px] uppercase tracking-wide text-muted">Streak</p>

      <div className="mt-2 flex items-center gap-3">
        <span className={`flex shrink-0 ${flickerClass}`}>
          {tier ? <FlameIcon size={tier.size} color={tier.color} /> : <SnowflakeIcon size={30} />}
        </span>
        <div className="min-w-0">
          <p
            className="tnum text-4xl font-black leading-none"
            style={tier ? { color: tier.color, textShadow: `0 0 24px ${tier.color}66` } : undefined}
          >
            {streak}
            <span className="ml-1.5 text-sm font-normal text-muted">day{streak === 1 ? "" : "s"}</span>
          </p>
          <p className="tnum mt-1 text-xs text-muted">Best: {longestStreak} days</p>
        </div>
      </div>

      {tier && (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide" style={{ color: tier.color }}>
          {tier.label}
        </p>
      )}

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{
            width: `${progress}%`,
            background: tier ? `linear-gradient(90deg, ${tier.color}, ${tier.glow})` : "var(--accent)",
            boxShadow: tier ? `0 0 10px ${tier.color}88` : undefined,
          }}
        />
      </div>

      {milestone !== null && (
        <p className="tnum mt-2 text-xs text-muted">
          {milestone - streak} day{milestone - streak === 1 ? "" : "s"} to next milestone
        </p>
      )}
    </div>
  );
}
