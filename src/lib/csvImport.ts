import type { WeightUnit } from "@/lib/units";
import { toKg } from "@/lib/units";

export type ImportedSet = {
  weightKg: number | null;
  reps: number | null;
  distanceKm: number | null;
  durationSeconds: number | null;
  isWarmup: boolean;
};

export type ImportedExercise = {
  name: string;
  sets: ImportedSet[];
};

export type ImportedWorkout = {
  title: string;
  startedAt: Date;
  finishedAt: Date | null;
  exercises: ImportedExercise[];
};

export type ImportParseResult =
  | { ok: true; format: "strong" | "hevy"; workouts: ImportedWorkout[]; skippedRows: number }
  | { ok: false; error: string };

// Minimal RFC4180 parser — handles quoted fields with embedded commas,
// newlines, and escaped ("") quotes, which is all Strong/Hevy exports use.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const c = normalized[i];
    if (inQuotes) {
      if (c === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

function num(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

const MONTH_ABBREVS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// Both known formats (and the generic fallback) are parsed as UTC
// explicitly rather than left to the JS engine's local-time default for a
// bare/offset-less string — that default depends on the server's own
// timezone (always UTC in production, but not necessarily in local dev),
// which would make the same file import to different instants depending on
// where the code happens to run.
function parseFlexibleDate(v: string | undefined): Date | null {
  if (!v) return null;
  const trimmed = v.trim();

  // Strong: "2024-01-15 08:30:00"
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (isoMatch) {
    const [, year, month, day, hour, minute, second] = isoMatch;
    return new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second ?? 0))
    );
  }

  // Hevy: "27 Dec 2023, 19:32"
  const hevyMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3})\w*\s+(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hevyMatch) {
    const [, day, monthAbbrev, year, hour, minute, second] = hevyMatch;
    const month = MONTH_ABBREVS.indexOf(monthAbbrev.toLowerCase());
    if (month !== -1) {
      return new Date(Date.UTC(Number(year), month, Number(day), Number(hour), Number(minute), Number(second ?? 0)));
    }
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function headerIndex(headers: string[], name: string): number {
  return headers.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
}

function parseStrong(rows: string[][], unit: WeightUnit): { workouts: ImportedWorkout[]; skippedRows: number } {
  const headers = rows[0];
  const col = {
    date: headerIndex(headers, "Date"),
    workoutName: headerIndex(headers, "Workout Name"),
    exerciseName: headerIndex(headers, "Exercise Name"),
    weight: headerIndex(headers, "Weight"),
    reps: headerIndex(headers, "Reps"),
    distance: headerIndex(headers, "Distance"),
    seconds: headerIndex(headers, "Seconds"),
    duration: headerIndex(headers, "Duration"),
  };

  const byWorkout = new Map<string, ImportedWorkout>();
  let skippedRows = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const dateStr = r[col.date];
    const workoutName = r[col.workoutName]?.trim();
    const exerciseName = r[col.exerciseName]?.trim();
    const startedAt = parseFlexibleDate(dateStr);

    if (!startedAt || !workoutName || !exerciseName) {
      skippedRows++;
      continue;
    }

    const key = `${dateStr}|${workoutName}`;
    let workout = byWorkout.get(key);
    if (!workout) {
      const durationSeconds = col.duration >= 0 ? num(r[col.duration]) : null;
      workout = {
        title: workoutName,
        startedAt,
        finishedAt: durationSeconds ? new Date(startedAt.getTime() + durationSeconds * 1000) : null,
        exercises: [],
      };
      byWorkout.set(key, workout);
    }

    let exercise = workout.exercises.find((e) => e.name.toLowerCase() === exerciseName.toLowerCase());
    if (!exercise) {
      exercise = { name: exerciseName, sets: [] };
      workout.exercises.push(exercise);
    }

    const weight = col.weight >= 0 ? num(r[col.weight]) : null;
    const reps = col.reps >= 0 ? num(r[col.reps]) : null;
    const distance = col.distance >= 0 ? num(r[col.distance]) : null;
    const seconds = col.seconds >= 0 ? num(r[col.seconds]) : null;

    if (weight === null && reps === null && distance === null && seconds === null) {
      skippedRows++;
      continue;
    }

    exercise.sets.push({
      weightKg: weight !== null ? toKg(weight, unit) : null,
      reps: reps !== null ? Math.round(reps) : null,
      distanceKm: distance,
      durationSeconds: seconds !== null ? Math.round(seconds) : null,
      isWarmup: false,
    });
  }

  return { workouts: [...byWorkout.values()], skippedRows };
}

function parseHevy(rows: string[][]): { workouts: ImportedWorkout[]; skippedRows: number } {
  const headers = rows[0];
  const col = {
    title: headerIndex(headers, "title"),
    startTime: headerIndex(headers, "start_time"),
    endTime: headerIndex(headers, "end_time"),
    exerciseTitle: headerIndex(headers, "exercise_title"),
    setType: headerIndex(headers, "set_type"),
    weightKg: headerIndex(headers, "weight_kg"),
    reps: headerIndex(headers, "reps"),
    distanceKm: headerIndex(headers, "distance_km"),
    durationSeconds: headerIndex(headers, "duration_seconds"),
  };

  const byWorkout = new Map<string, ImportedWorkout>();
  let skippedRows = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const title = r[col.title]?.trim();
    const exerciseName = r[col.exerciseTitle]?.trim();
    const startedAt = parseFlexibleDate(r[col.startTime]);

    if (!startedAt || !title || !exerciseName) {
      skippedRows++;
      continue;
    }

    const key = `${r[col.startTime]}|${title}`;
    let workout = byWorkout.get(key);
    if (!workout) {
      const finishedAt = col.endTime >= 0 ? parseFlexibleDate(r[col.endTime]) : null;
      workout = { title, startedAt, finishedAt, exercises: [] };
      byWorkout.set(key, workout);
    }

    let exercise = workout.exercises.find((e) => e.name.toLowerCase() === exerciseName.toLowerCase());
    if (!exercise) {
      exercise = { name: exerciseName, sets: [] };
      workout.exercises.push(exercise);
    }

    const weightKg = col.weightKg >= 0 ? num(r[col.weightKg]) : null;
    const reps = col.reps >= 0 ? num(r[col.reps]) : null;
    const distanceKm = col.distanceKm >= 0 ? num(r[col.distanceKm]) : null;
    const durationSeconds = col.durationSeconds >= 0 ? num(r[col.durationSeconds]) : null;

    if (weightKg === null && reps === null && distanceKm === null && durationSeconds === null) {
      skippedRows++;
      continue;
    }

    exercise.sets.push({
      weightKg,
      reps: reps !== null ? Math.round(reps) : null,
      distanceKm,
      durationSeconds: durationSeconds !== null ? Math.round(durationSeconds) : null,
      isWarmup: (r[col.setType] ?? "").trim().toLowerCase() === "warmup",
    });
  }

  return { workouts: [...byWorkout.values()], skippedRows };
}

export function parseImportCsv(text: string, unit: WeightUnit): ImportParseResult {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return { ok: false, error: "That file doesn't have any data rows." };
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const isStrong = headers.includes("workout name") && headers.includes("exercise name") && headers.includes("weight");
  const isHevy = headers.includes("title") && headers.includes("exercise_title") && headers.includes("weight_kg");

  if (isStrong) {
    const { workouts, skippedRows } = parseStrong(rows, unit);
    return { ok: true, format: "strong", workouts, skippedRows };
  }
  if (isHevy) {
    const { workouts, skippedRows } = parseHevy(rows);
    return { ok: true, format: "hevy", workouts, skippedRows };
  }
  return {
    ok: false,
    error: "Unrecognized CSV format — this importer supports Strong and Hevy exports only.",
  };
}
