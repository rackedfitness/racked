import { useEffect } from "react";

// Shared by every full-screen modal/sheet — keyboard-only users have no other
// way to dismiss a dialog built from plain divs (no native <dialog> element).
export function useEscapeToClose(onClose: () => void) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
}
