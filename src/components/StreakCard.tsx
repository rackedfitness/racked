import { FlameIcon } from "@/components/UIIcons";
import { SnowflakeIcon } from "@/components/StreakIcons";

type Tier = {
  minStreak: number;
  color: string;
  glow: string;
  size: number;
  flicker: "none" | "soft" | "strong";
  label: string;
};

// Escalating visual intensity the longer the streak runs — bigger, hotter,
// more animated flame the further up the list, mirroring the rank-tier
// pattern used elsewhere in the app (see rankSystem.ts / BodyMap intensity).
const TIERS: Tier[] = [
  { minStreak: 1, color: "#ff9f4d", glow: "#ff9f4d", size: 30, flicker: "none", label: "Warming up" },
  { minStreak: 3, color: "#ff8a3d", glow: "#ff8a3d", size: 34, flicker: "soft", label: "Heating up" },
  { minStreak: 7, color: "#ff6a1a", glow: "#ff6a1a", size: 38, flicker: "soft", label: "On fire" },
  { minStreak: 14, color: "#ff4d00", glow: "#ff7a00", size: 44, flicker: "strong", label: "Blazing" },
  { minStreak: 30, color: "#ff2d00", glow: "#ffb000", size: 52, flicker: "strong", label: "Unstoppable" },
];

function tierFor(streak: number): Tier {
  let best = TIERS[0];
  for (const t of TIERS) if (streak >= t.minStreak) best = t;
  return best;
}

export default function StreakCard({
  streak,
  longestStreak,
  milestone,
}: {
  streak: number;
  longestStreak: number;
  milestone: number | null;
}) {
  const tier = streak > 0 ? tierFor(streak) : null;
  const progress = Math.min(100, (streak / Math.max(longestStreak, 1)) * 100);
  const flickerClass =
    tier?.flicker === "strong"
      ? "animate-flame-flicker-strong"
      : tier?.flicker === "soft"
        ? "animate-flame-flicker"
        : "";

  return (
    <div
      className={`relative overflow-hidden rounded-lg border p-4 transition-colors ${
        tier?.flicker === "strong" ? "animate-blaze-pulse" : ""
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
