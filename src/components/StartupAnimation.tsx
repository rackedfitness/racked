"use client";

import { useEffect, useState } from "react";

// Traced directly from the uploaded logo image (public/ChatGPT Image Aug 28,
// 2026, 11_39_11 PM.png) via potrace, cropped to just the "RACKED" wordmark.
const WORD_PATH =
  "M 14 65.500 L 14 116 18.500 116 L 23 116 23 70 L 23 24 62.843 24 C 102.504 24, 102.705 24.010, 107.040 26.303 C 113.705 29.828, 116 34.978, 116 46.414 C 116 56.886, 114.977 61.325, 111.774 64.755 C 106.811 70.069, 104.964 70.465, 82.621 71 L 61.742 71.500 79.531 86 C 89.316 93.975, 101.524 104.008, 106.661 108.296 L 116.002 116.091 122.681 115.796 L 129.360 115.500 107.757 98 L 86.154 80.500 95.987 79.882 C 110.621 78.963, 117.342 75.009, 122.133 64.500 C 123.610 61.260, 123.956 57.935, 123.956 47 C 123.956 31.182, 122.808 27.560, 115.930 21.672 C 108.331 15.168, 106.870 15, 57.818 15 L 14 15 14 65.500 M 171.018 16.958 C 163.716 19.478, 157.700 25.785, 155.553 33.171 C 154.216 37.770, 154.016 44.446, 154.238 77.047 L 154.500 115.500 158.717 115.806 L 162.934 116.112 163.217 76.306 C 163.488 38.237, 163.591 36.327, 165.577 32.540 C 166.943 29.937, 169.162 27.783, 172.051 26.255 L 176.447 23.930 212.651 24.215 C 247.424 24.489, 248.965 24.582, 251.616 26.562 C 258.214 31.490, 258.471 32.418, 258.812 52.570 L 259.124 71 220.062 71 L 181 71 181 75.500 L 181 80 220 80 L 259 80 259 98 L 259 116 263.541 116 L 268.083 116 267.791 74.250 C 267.506 33.308, 267.457 32.420, 265.279 28.347 C 264.057 26.062, 261.357 22.787, 259.279 21.068 C 252.406 15.384, 249.311 14.997, 211.068 15.033 C 179.806 15.062, 175.976 15.246, 171.018 16.958 M 316 16.537 C 310.268 18.316, 304.560 23.037, 301.721 28.347 C 299.595 32.322, 299.486 33.766, 299.170 62 C 298.955 81.272, 299.229 93.271, 299.960 96.607 C 301.448 103.397, 305.730 108.980, 312.199 112.564 L 317.500 115.500 361.250 115.799 L 405 116.098 405 111.589 L 405 107.081 362.250 106.790 C 321.194 106.512, 319.361 106.419, 316.001 104.444 C 314.076 103.314, 311.485 100.614, 310.244 98.444 C 308.021 94.559, 307.991 94.046, 308.243 64.321 C 308.487 35.614, 308.601 34.008, 310.562 31.383 C 311.696 29.865, 313.866 27.696, 315.384 26.562 C 318.058 24.564, 319.497 24.491, 361.572 24.219 L 405 23.939 405 19.469 L 405 15 362.750 15.070 C 329.545 15.124, 319.537 15.438, 316 16.537 M 436.241 65.250 L 436.500 115.500 440.750 115.807 L 445 116.115 445.036 100.807 L 445.071 85.500 459.919 74.750 C 468.086 68.837, 475.087 64, 475.477 64 C 476.152 64, 492.085 78.305, 520.295 104.238 L 533.091 116 539.795 115.978 L 546.500 115.957 541.500 111.222 C 538.750 108.618, 524.462 95.596, 509.749 82.284 L 482.997 58.081 490.249 52.733 C 494.237 49.792, 503.800 42.880, 511.500 37.372 C 519.200 31.864, 529.292 24.578, 533.927 21.179 L 542.354 15 534.807 15 L 527.260 15 505.380 30.786 C 493.346 39.468, 475.048 52.743, 464.717 60.286 C 454.387 67.829, 445.725 74, 445.467 74 C 445.210 74, 445 60.725, 445 44.500 L 445 15 440.491 15 L 435.982 15 436.241 65.250 M 577 19.500 L 577 24 626 24 L 675 24 675 19.500 L 675 15 626 15 L 577 15 577 19.500 M 707 65.500 L 707 116 746.818 116 C 791.620 116, 794 115.705, 801.132 109.262 C 809.360 101.829, 809.459 101.354, 809.817 67.736 C 810.190 32.683, 809.703 29.650, 802.542 22.490 C 795.246 15.193, 793.821 15, 747.318 15 L 707 15 707 65.500 M 715 65.455 L 715 107 751.288 107 C 786.933 107, 787.655 106.960, 792.034 104.750 C 794.954 103.276, 797.272 101.120, 798.752 98.500 C 800.979 94.560, 801.009 94.047, 800.757 64.321 C 800.513 35.614, 800.399 34.008, 798.438 31.383 C 797.304 29.865, 795.134 27.696, 793.616 26.562 C 790.960 24.577, 789.435 24.489, 752.928 24.205 L 715 23.910 715 65.455 M 577 88.500 L 577 116 626 116 L 675 116 675 111.510 L 675 107.021 630.250 106.760 L 585.500 106.500 585.227 88.261 L 584.955 70.022 627.727 69.761 L 670.500 69.500 670.807 65.250 L 671.115 61 624.057 61 L 577 61 577 88.500";

const VIEW_W = 824;
const VIEW_H = 130;

// R's stem, read off the same trace (the "M 14 65.500 L 14 116 ... L 14 15 14
// 65.500" sub-path) — this is the anchor rect that survives the word's
// collapse and becomes the barbell bar.
const STEM_X = 14;
const STEM_Y = 15;
const STEM_W = 9; // 23 - 14
const STEM_H = 101; // 116 - 15
const STEM_CX = STEM_X + STEM_W / 2;
const STEM_CY = STEM_Y + STEM_H / 2;

const CENTER_X = VIEW_W / 2;
const CENTER_Y = VIEW_H / 2;
const BAR_MOVE_DX = CENTER_X - STEM_CX;
const BAR_HALF = STEM_H / 2;

const PLATE_W = 16;
const PLATE_H = 49;
const SLEEVE_W = 10;
const SLEEVE_H = 29;
const barEndL = CENTER_X - BAR_HALF;
const barEndR = CENTER_X + BAR_HALF;

export default function StartupAnimation() {
  const [visible, setVisible] = useState(true);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    const skipTimer = setTimeout(() => setCanSkip(true), 1000);
    const t = setTimeout(() => setVisible(false), 9250);
    return () => {
      clearTimeout(skipTimer);
      clearTimeout(t);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="splash-fade-out fixed inset-0 z-50 flex items-center justify-center bg-background"
      onClick={() => canSkip && setVisible(false)}
    >
      <style>{`
        @keyframes splash-word-collapse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.05); opacity: 0; }
        }
        .splash-word-collapse {
          transform-box: view-box;
          transform-origin: ${STEM_CX}px ${STEM_CY}px;
          animation: splash-word-collapse 1.5s cubic-bezier(0.6, 0, 0.85, 0.35) 2.7s both;
        }
        @keyframes splash-bar-move-concrete {
          0% { transform: translateX(0) scale(1) rotate(0deg); color: var(--foreground); }
          47% { transform: translateX(0) scale(0.22) rotate(0deg); color: var(--foreground); }
          56% { transform: translateX(0) scale(0.22) rotate(0deg); color: var(--foreground); }
          100% { transform: translateX(${BAR_MOVE_DX}px) scale(1) rotate(90deg); color: var(--accent); }
        }
        .splash-bar-group {
          transform-box: fill-box;
          transform-origin: center;
          animation: splash-bar-move-concrete 3.2s cubic-bezier(0.65, 0, 0.35, 1) 2.7s both;
        }
      `}</style>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="splash-word-in w-full max-w-3xl px-4">
        <path d={WORD_PATH} className="splash-word-collapse text-foreground" fill="currentColor" />

        <g className="splash-bar-group text-foreground">
          <rect x={STEM_X} y={STEM_Y} width={STEM_W} height={STEM_H} fill="currentColor" />
        </g>

        <g className="text-accent" fill="currentColor">
          <rect className="splash-plate" x={barEndL - PLATE_W} y={CENTER_Y - PLATE_H / 2} width={PLATE_W} height={PLATE_H} rx={2} />
          <rect className="splash-plate" x={barEndR} y={CENTER_Y - PLATE_H / 2} width={PLATE_W} height={PLATE_H} rx={2} />
          <rect className="splash-plate-outer" x={barEndL - PLATE_W - SLEEVE_W} y={CENTER_Y - SLEEVE_H / 2} width={SLEEVE_W} height={SLEEVE_H} rx={1.5} />
          <rect className="splash-plate-outer" x={barEndR + PLATE_W} y={CENTER_Y - SLEEVE_H / 2} width={SLEEVE_W} height={SLEEVE_H} rx={1.5} />
        </g>
      </svg>
    </div>
  );
}
