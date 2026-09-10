"use client";

import { useState, useTransition } from "react";
import { setTemplateVisibility } from "@/app/workout/actions";

export default function PlanVisibilityToggle({
  templateId,
  isPublic,
}: {
  templateId: string;
  isPublic: boolean;
}) {
  const [publicNow, setPublicNow] = useState(isPublic);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !publicNow;
    setPublicNow(next);
    startTransition(async () => {
      await setTemplateVisibility(templateId, next);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={`self-start text-xs ${publicNow ? "text-accent" : "text-muted"} disabled:opacity-50`}
    >
      {publicNow ? "🌐 Public — anyone can copy this plan" : "🔒 Private — tap to share it publicly"}
    </button>
  );
}
