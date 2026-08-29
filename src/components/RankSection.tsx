"use client";

import { useState } from "react";
import RankBadge from "@/components/RankBadge";
import { formatTopPercent, type LiftRankResult } from "@/lib/rankSystem";

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function RankSection({
  topRank,
  liftRanks,
}: {
  topRank: LiftRankResult;
  liftRanks: LiftRankResult[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-lg border border-card-border bg-card p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Overall rank</p>
          <RankBadge rank={topRank.rank} size="lg" />
        </div>
        <div className="text-right">
          <p className="tnum text-lg">{topRank.label}</p>
          <p className="tnum text-xs text-muted">Top {formatTopPercent(topRank.percentile)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex items-center justify-center gap-1 py-1 text-xs text-muted hover:text-foreground"
      >
        {expanded ? "Hide all lifts" : "Show all lifts"}
        <ChevronIcon expanded={expanded} />
      </button>

      {expanded && (
        <div className="grid grid-cols-2 gap-2">
          {liftRanks.map((lr) => (
            <div key={lr.lift} className="rounded-lg border border-card-border bg-card p-3">
              <p className="text-xs text-muted">{lr.label}</p>
              <p className="tnum text-sm">{Math.round(lr.oneRepMaxKg)}kg e1RM</p>
              <RankBadge rank={lr.rank} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
