type CategoryCounts = Record<string, number>;

// Volume tiers, low to high — same idea as Hevy's muscle heatmap: more
// working sets on a muscle group this period, hotter it glows.
const INTENSITY_TIERS = [
  { min: 15, color: "rgba(153,27,27,0.92)", label: "15+" },
  { min: 10, color: "rgba(153,27,27,0.7)", label: "10-14" },
  { min: 5, color: "rgba(153,27,27,0.48)", label: "5-9" },
  { min: 1, color: "rgba(153,27,27,0.26)", label: "1-4" },
] as const;
const NONE = "transparent";

export function intensityColor(setCount: number): string {
  for (const tier of INTENSITY_TIERS) {
    if (setCount >= tier.min) return tier.color;
  }
  return NONE;
}

function fillFor(category: string, counts: CategoryCounts) {
  return intensityColor(counts[category] ?? 0);
}

// Source art: public/bodymap/{front,back}-full.png, with per-category
// region masks (public/bodymap/{front,back}-{category}-mask.png) extracted
// via flood-fill against the transparent gaps that separate each muscle in
// the artwork — see the mask PNGs for the ground truth, not hand-traced
// coordinates.
const FRONT_SRC_W = 496;
const FRONT_SRC_H = 969;
const BACK_SRC_W = 514;
const BACK_SRC_H = 960;

const FRONT_CATEGORIES = ["shoulders", "chest", "arms", "core", "legs"] as const;
const BACK_CATEGORIES = ["shoulders", "back", "arms", "legs"] as const;

function FrontOverlay({ counts }: { counts: CategoryCounts }) {
  return (
    <>
      <defs>
        {FRONT_CATEGORIES.map((cat) => (
          <mask key={cat} id={`front-${cat}-mask`} maskUnits="userSpaceOnUse" x={0} y={0} width={FRONT_SRC_W} height={FRONT_SRC_H}>
            <image href={`/bodymap/front-${cat}-mask.png`} x={0} y={0} width={FRONT_SRC_W} height={FRONT_SRC_H} />
          </mask>
        ))}
      </defs>
      {FRONT_CATEGORIES.map((cat) => (
        <rect
          key={cat}
          x={0}
          y={0}
          width={FRONT_SRC_W}
          height={FRONT_SRC_H}
          fill={fillFor(cat, counts)}
          mask={`url(#front-${cat}-mask)`}
        />
      ))}
    </>
  );
}

function BackOverlay({ counts }: { counts: CategoryCounts }) {
  return (
    <>
      <defs>
        {BACK_CATEGORIES.map((cat) => (
          <mask key={cat} id={`back-${cat}-mask`} maskUnits="userSpaceOnUse" x={0} y={0} width={BACK_SRC_W} height={BACK_SRC_H}>
            <image href={`/bodymap/back-${cat}-mask.png`} x={0} y={0} width={BACK_SRC_W} height={BACK_SRC_H} />
          </mask>
        ))}
      </defs>
      {BACK_CATEGORIES.map((cat) => (
        <rect
          key={cat}
          x={0}
          y={0}
          width={BACK_SRC_W}
          height={BACK_SRC_H}
          fill={fillFor(cat, counts)}
          mask={`url(#back-${cat}-mask)`}
        />
      ))}
    </>
  );
}

export default function BodyMap({
  counts = {},
  compact = false,
  size = 420,
  showLabels = true,
}: {
  counts?: CategoryCounts;
  compact?: boolean;
  size?: number;
  showLabels?: boolean;
}) {
  const frontW = Math.round((size * FRONT_SRC_W) / FRONT_SRC_H);
  const backW = Math.round((size * BACK_SRC_W) / BACK_SRC_H);
  const gapClass = size < 150 ? "gap-2" : "gap-6";
  return (
    <div className={compact ? "" : "rounded-lg border border-card-border bg-card p-4"}>
      {!compact && <p className="mb-4 text-sm text-muted">Working sets per muscle group, last 7 days</p>}
      <div className={`flex justify-center ${gapClass}`}>
        <div className="flex flex-col items-center gap-1">
          <svg viewBox={`0 0 ${FRONT_SRC_W} ${FRONT_SRC_H}`} width={frontW} height={size}>
            <image href="/bodymap/front-full.png" x="0" y="0" width={FRONT_SRC_W} height={FRONT_SRC_H} />
            <FrontOverlay counts={counts} />
          </svg>
          {showLabels && <span className="text-xs uppercase tracking-wide text-muted">Front</span>}
        </div>
        <div className="flex flex-col items-center gap-1">
          <svg viewBox={`0 0 ${BACK_SRC_W} ${BACK_SRC_H}`} width={backW} height={size}>
            <image href="/bodymap/back-full.png" x="0" y="0" width={BACK_SRC_W} height={BACK_SRC_H} />
            <BackOverlay counts={counts} />
          </svg>
          {showLabels && <span className="text-xs uppercase tracking-wide text-muted">Back</span>}
        </div>
      </div>
      {!compact && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border border-card-border" />
            0 sets
          </span>
          {[...INTENSITY_TIERS].reverse().map((tier) => (
            <span key={tier.label} className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: tier.color }} />
              {tier.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
