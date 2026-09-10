"use client";

import { useState } from "react";
import { formatVolume, formatWorkoutDuration } from "@/lib/stats";
import type { WeightUnit } from "@/lib/units";

type RecapData = {
  title: string;
  dateLabel: string;
  durationSeconds: number | null;
  volume: number;
  prCount: number;
  caloriesBurned: number;
  gymName: string | null;
  weightUnit: WeightUnit;
};

const WIDTH = 1080;
const HEIGHT = 1350;

function cssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function drawStatBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  label: string,
  cardColor: string,
  borderColor: string,
  accent: string,
  foreground: string
) {
  ctx.fillStyle = cardColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.font = "700 64px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(value, x + w / 2, y + h / 2 + 10);

  ctx.fillStyle = foreground;
  ctx.font = "500 26px system-ui, sans-serif";
  ctx.fillText(label.toUpperCase(), x + w / 2, y + h - 30);
}

async function drawRecapCard(data: RecapData): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;

  const background = cssVar("--background", "#0a0a0a");
  const card = cssVar("--card", "#151515");
  const border = cssVar("--card-border", "#2a2a2a");
  const accent = cssVar("--accent", "#ccff00");
  const foreground = cssVar("--foreground", "#f5f5f5");
  const muted = cssVar("--muted", "#888888");

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.textAlign = "left";
  ctx.fillStyle = muted;
  ctx.font = "500 32px system-ui, sans-serif";
  ctx.fillText(data.dateLabel, 60, 130);

  ctx.fillStyle = foreground;
  ctx.font = "800 76px system-ui, sans-serif";
  wrapText(ctx, data.title, 60, 220, WIDTH - 120, 84);

  if (data.gymName) {
    ctx.fillStyle = muted;
    ctx.font = "500 30px system-ui, sans-serif";
    ctx.fillText(`📍 ${data.gymName}`, 60, 340);
  }

  const stats: { value: string; label: string }[] = [];
  if (data.durationSeconds != null) stats.push({ value: formatWorkoutDuration(data.durationSeconds), label: "Time" });
  stats.push({ value: formatVolume(data.volume, data.weightUnit), label: "Volume" });
  if (data.prCount > 0) stats.push({ value: String(data.prCount), label: "New PRs" });
  if (data.caloriesBurned > 0) stats.push({ value: String(Math.round(data.caloriesBurned)), label: "Calories" });

  const gridTop = 460;
  const boxH = 220;
  const gap = 24;
  const cols = stats.length <= 2 ? stats.length : 2;
  const boxW = (WIDTH - 120 - gap * (cols - 1)) / cols;

  stats.forEach((s, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 60 + col * (boxW + gap);
    const y = gridTop + row * (boxH + gap);
    drawStatBox(ctx, x, y, boxW, boxH, s.value, s.label, card, border, accent, foreground);
  });

  ctx.textAlign = "center";
  ctx.fillStyle = accent;
  ctx.font = "800 40px system-ui, sans-serif";
  ctx.fillText("RACKED", WIDTH / 2, HEIGHT - 60);

  return canvas;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}

export default function ShareRecapButton(props: RecapData) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");

  async function handleShare() {
    setStatus("working");
    try {
      const canvas = await drawRecapCard(props);
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Could not generate image");

      const file = new File([blob], "racked-workout.png", { type: "image/png" });

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: props.title, text: `${props.title} on Racked` });
        setStatus("done");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "racked-workout.png";
        a.click();
        URL.revokeObjectURL(url);
        setStatus("done");
      }
    } catch {
      setStatus("error");
    } finally {
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={status === "working"}
      className="w-full rounded-md border border-card-border px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-foreground disabled:opacity-60"
    >
      {status === "working" ? "Generating..." : status === "done" ? "Shared!" : status === "error" ? "Failed — retry" : "Share recap card"}
    </button>
  );
}
