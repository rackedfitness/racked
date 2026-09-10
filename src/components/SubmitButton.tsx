"use client";

import { useFormStatus } from "react-dom";

// Wraps a form's submit button with useFormStatus so a click gets instant
// visual feedback (dimmed + disabled) instead of sitting inert for the full
// server round trip — must be a child of the <form>, not the form itself,
// since useFormStatus reads the nearest parent form's pending state.
export default function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className ?? ""} ${pending ? "opacity-50" : ""}`}>
      {children}
    </button>
  );
}
