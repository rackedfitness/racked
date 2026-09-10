"use client";

import { useState } from "react";
import ReportModal from "@/components/ReportModal";

export default function ReportWorkoutButton({ workoutId }: { workoutId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-muted">
        Report
      </button>
      {open && <ReportModal workoutId={workoutId} onClose={() => setOpen(false)} />}
    </>
  );
}
