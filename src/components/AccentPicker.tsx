"use client";

import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/UIIcons";

const PRESETS = ["#ccff00", "#2f9eff", "#f5a623", "#f0553e", "#a855f7", "#14b8a6", "#ec4899"];
const STORAGE_KEY = "racked_accent";

export default function AccentPicker() {
  const [accent, setAccent] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setAccent(saved);
      document.documentElement.style.setProperty("--accent", saved);
    } else {
      setAccent(PRESETS[0]);
    }
  }, []);

  function pick(color: string) {
    setAccent(color);
    localStorage.setItem(STORAGE_KEY, color);
    document.documentElement.style.setProperty("--accent", color);
  }

  return (
    <div className="flex gap-2">
      {PRESETS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => pick(color)}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: color }}
          aria-label={color}
        >
          {accent === color && <CheckIcon size={14} className="text-black" />}
        </button>
      ))}
    </div>
  );
}
