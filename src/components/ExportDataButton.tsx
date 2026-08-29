"use client";

import { useTransition } from "react";
import { exportMyData } from "@/app/settings/actions";

export default function ExportDataButton() {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const json = await exportMyData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "racked-export.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isPending}
      className="rounded-md border border-card-border px-3 py-1.5 text-sm text-accent disabled:opacity-50"
    >
      {isPending ? "Preparing..." : "⬇ Export my data (JSON)"}
    </button>
  );
}
