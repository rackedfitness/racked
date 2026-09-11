"use client";

import { useState } from "react";
import { importWorkoutsCsv, type ImportSummary } from "@/app/settings/importActions";
import type { WeightUnit } from "@/lib/units";

export default function ImportCsvForm({ defaultUnit }: { defaultUnit: WeightUnit }) {
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setStatus("working");
    setError(null);
    setSummary(null);
    try {
      const result = await importWorkoutsCsv(formData);
      setSummary(result);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
      setStatus("error");
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <label className="text-sm">
        <span className="mb-1 block text-muted">CSV file</span>
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-2 file:py-1 file:text-xs file:font-medium file:text-accent-ink"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-muted">
          Weight unit in file (Strong exports only — Hevy exports already specify kg)
        </span>
        <select
          name="unit"
          defaultValue={defaultUnit}
          className="w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="kg">kg</option>
          <option value="lbs">lbs</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={status === "working"}
        className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-ink disabled:opacity-60"
      >
        {status === "working" ? "Importing..." : "Import"}
      </button>

      {error && <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-400">{error}</p>}
      {summary && (
        <div className="rounded-md border border-card-border bg-card p-3 text-sm">
          <p className="font-medium text-accent">
            Imported {summary.workoutsImported} workout{summary.workoutsImported === 1 ? "" : "s"} (
            {summary.setsImported} sets) from {summary.format === "strong" ? "Strong" : "Hevy"}.
          </p>
          {summary.exercisesCreated > 0 && (
            <p className="text-muted">Created {summary.exercisesCreated} new exercises.</p>
          )}
          {summary.skippedRows > 0 && (
            <p className="text-muted">Skipped {summary.skippedRows} rows we couldn&rsquo;t parse.</p>
          )}
          <p className="mt-1 text-muted">Imported workouts are private — find them in your History.</p>
        </div>
      )}
    </form>
  );
}
