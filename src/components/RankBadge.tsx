"use client";

import { useState } from "react";
import type { RankTier } from "@/lib/rankSystem";

const WING_BLADES = ["64,24 92,4 70,42", "64,40 96,30 70,56", "62,56 92,54 68,70"];

export default function RankBadge({
  rank,
  size = "md",
  showLabel = true,
}: {
  rank: RankTier;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const isChampion = rank.key === "champion";
  const dims = size === "sm" ? 32 : size === "lg" ? 72 : 44;
  const [customImageFailed, setCustomImageFailed] = useState(false);

  const glow = `drop-shadow(0 0 ${isChampion ? 10 : 4}px color-mix(in srgb, ${rank.color} 65%, transparent))`;

  return (
    <span className="inline-flex flex-col items-center gap-1">
      {!customImageFailed ? (
        // Drop a file at public/ranks/<key>.png to override the built-in icon below.
        <img
          src={`/ranks/${rank.key}.png`}
          alt={rank.label}
          width={dims}
          height={(dims * 120) / 100}
          className={`object-contain ${isChampion ? "animate-pr-pop" : ""}`}
          style={{ filter: glow }}
          onError={() => setCustomImageFailed(true)}
        />
      ) : (
        <svg
          width={dims}
          height={(dims * 120) / 100}
          viewBox="0 0 100 120"
          className={isChampion ? "animate-pr-pop" : ""}
          style={{ filter: glow }}
        >
          {/* top flourish */}
          <line x1="50" y1="1" x2="50" y2="6" stroke={rank.color} strokeWidth="1.5" />
          <circle cx="50" cy="1" r="1.5" fill={rank.color} />

          {/* wings */}
          <g>
            {WING_BLADES.map((pts) => (
              <polygon key={pts} points={pts} fill={rank.color} fillOpacity={0.9} stroke="rgba(0,0,0,0.3)" strokeWidth={1.25} strokeLinejoin="round" />
            ))}
          </g>
          <g transform="scale(-1,1) translate(-100,0)">
            {WING_BLADES.map((pts) => (
              <polygon key={pts} points={pts} fill={rank.color} fillOpacity={0.9} stroke="rgba(0,0,0,0.3)" strokeWidth={1.25} strokeLinejoin="round" />
            ))}
          </g>

          {/* core shield */}
          <polygon
            points="50,6 65,26 65,62 50,100 35,62 35,26"
            fill={rank.color}
            stroke={isChampion ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.35)"}
            strokeWidth={isChampion ? 3 : 2}
            strokeLinejoin="round"
          />
          {/* glossy highlight */}
          <polygon points="50,6 65,26 59,26 50,10" fill="rgba(255,255,255,0.35)" />
          {/* recessed inner face */}
          <polygon points="50,16 59,30 59,56 50,90 41,56 41,30" fill="rgba(0,0,0,0.18)" />

          {/* chevrons */}
          <polyline points="43,32 50,39 57,32" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {/* dumbbell */}
          <rect x="33" y="42" width="5" height="14" rx="2" fill="rgba(0,0,0,0.6)" />
          <rect x="39" y="44" width="4" height="10" rx="1.5" fill="rgba(0,0,0,0.6)" />
          <rect x="43" y="47.5" width="14" height="3" rx="1.5" fill="rgba(0,0,0,0.6)" />
          <rect x="57" y="44" width="4" height="10" rx="1.5" fill="rgba(0,0,0,0.6)" />
          <rect x="62" y="42" width="5" height="14" rx="2" fill="rgba(0,0,0,0.6)" />

          {/* lower chevron band */}
          <polygon points="37,60 50,70 63,60 63,65 50,75 37,65" fill="rgba(0,0,0,0.32)" />
        </svg>
      )}
      {showLabel && (
        <span
          className={`text-xs font-bold uppercase tracking-wide ${size === "lg" ? "text-sm" : ""}`}
          style={{ color: rank.color }}
        >
          {rank.label}
        </span>
      )}
    </span>
  );
}
