"use client";

import { useState, useTransition } from "react";
import { renameTemplate } from "@/app/workout/actions";

export default function PlanNameField({ templateId, name }: { templateId: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [isPending, startTransition] = useTransition();

  function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setValue(name);
      setEditing(false);
      return;
    }
    startTransition(async () => {
      await renameTemplate(templateId, trimmed);
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="min-w-0 flex-1 truncate text-left font-medium active:text-accent"
      >
        {name}
      </button>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setValue(name);
            setEditing(false);
          }
        }}
        autoFocus
        className="w-full min-w-0 rounded-md border border-card-border bg-background px-2 py-1 text-sm text-foreground"
      />
      <button
        type="button"
        onClick={save}
        disabled={isPending}
        className="shrink-0 text-xs font-medium text-accent disabled:opacity-50"
      >
        {isPending ? "..." : "Save"}
      </button>
    </div>
  );
}
