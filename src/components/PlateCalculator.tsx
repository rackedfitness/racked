"use client";

import { useMemo, useState } from "react";
import { calculatePlates, PLATE_SETS } from "@/lib/plates";
import type { WeightUnit } from "@/lib/units";

export default function PlateCalculator({ defaultUnit = "kg" }: { defaultUnit?: WeightUnit }) {
  const [unit, setUnit] = useState<WeightUnit>(defaultUnit);
  const preset = PLATE_SETS[unit];
  const [barWeight, setBarWeight] = useState(preset.barWeight);
  const [target, setTarget] = useState("");

  const targetNum = Number(target);
  const breakdown = useMemo(
    () => (targetNum > 0 ? calculatePlates(targetNum, barWeight, preset.plates) : null),
    [targetNum, barWeight, preset.plates]
  );

  function handleUnitChange(next: WeightUnit) {
    setUnit(next);
    setBarWeight(PLATE_SETS[next].barWeight);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-full border border-card-border bg-card p-1">
        {(["kg", "lbs"] as WeightUnit[]).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => handleUnitChange(u)}
            className={`flex-1 rounded-full py-1.5 text-center text-sm font-medium transition-colors ${
              unit === u ? "bg-accent text-accent-ink" : "text-muted"
            }`}
          >
            {u}
          </button>
        ))}
      </div>

      <label className="text-sm">
        <span className="mb-1 block text-muted">Target weight ({unit})</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.5"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder={`e.g. ${unit === "kg" ? "100" : "225"}`}
          className="w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted"
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-muted">Bar weight ({unit})</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.5"
          value={barWeight}
          onChange={(e) => setBarWeight(Number(e.target.value) || 0)}
          className="w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground"
        />
      </label>

      <div className="rounded-lg border border-card-border bg-card p-4">
        {!breakdown ? (
          <p className="py-6 text-center text-sm text-muted">Enter a target weight to see plates per side.</p>
        ) : breakdown.perSide.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            {targetNum <= barWeight ? "Target is at or below bar weight — no plates needed." : "Nothing to load."}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {breakdown.perSide.map((p, i) => (
                <span
                  key={i}
                  className="tnum flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent text-sm font-bold text-accent"
                >
                  {p}
                </span>
              ))}
            </div>
            <p className="text-center text-xs text-muted">plates per side</p>
            <div className="tnum flex justify-around border-t border-card-border pt-3 text-center">
              <div>
                <p className="text-lg font-bold">{breakdown.loadedTotal}{unit}</p>
                <p className="text-xs text-muted">Loaded total</p>
              </div>
              <div>
                <p className="text-lg font-bold">{breakdown.perSideWeight}{unit}</p>
                <p className="text-xs text-muted">Per side</p>
              </div>
            </div>
            {breakdown.remainder > 0.01 && (
              <p className="text-center text-xs text-amber-400">
                {breakdown.remainder}{unit} short of your target with the available plates — closest achievable is{" "}
                {breakdown.loadedTotal}{unit}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
