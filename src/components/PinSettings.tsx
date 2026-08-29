"use client";

import { useEffect, useState } from "react";
import NumberPad from "@/components/NumberPad";

const STORAGE_KEY = "racked_pin";
const PIN_LENGTH = 4;

type Phase = "idle" | "enter" | "confirm";

export default function PinSettings() {
  const [hasPin, setHasPin] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [entry, setEntry] = useState("");
  const [firstEntry, setFirstEntry] = useState("");
  const [shake, setShake] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  useEffect(() => {
    setHasPin(Boolean(localStorage.getItem(STORAGE_KEY)));
  }, []);

  useEffect(() => {
    if (entry.length < PIN_LENGTH) return;

    if (phase === "enter") {
      setFirstEntry(entry);
      setEntry("");
      setPhase("confirm");
      return;
    }

    if (phase === "confirm") {
      if (entry === firstEntry) {
        localStorage.setItem(STORAGE_KEY, entry);
        sessionStorage.setItem("racked_unlocked", "1");
        setHasPin(true);
        setPhase("idle");
        setEntry("");
        setFirstEntry("");
        setMismatch(false);
      } else {
        setShake(true);
        setMismatch(true);
        setTimeout(() => {
          setShake(false);
          setEntry("");
          setPhase("enter");
        }, 350);
      }
    }
  }, [entry, phase, firstEntry]);

  function startSetup() {
    setPhase("enter");
    setEntry("");
    setFirstEntry("");
    setMismatch(false);
  }

  function cancel() {
    setPhase("idle");
    setEntry("");
    setFirstEntry("");
    setMismatch(false);
  }

  function remove() {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("racked_unlocked");
    setHasPin(false);
  }

  return (
    <div className="rounded-lg border border-card-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">App lock (PIN)</p>
          <p className="text-xs text-muted">Require a PIN to open Racked, like a password.</p>
        </div>
      </div>

      {phase === "idle" ? (
        <button type="button" onClick={startSetup} className="mt-3 text-sm text-accent">
          {hasPin ? "Change PIN" : "Set a PIN"}
        </button>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-3">
          <p className="text-sm text-muted">
            {phase === "enter" ? "Enter a new 4-digit PIN" : "Confirm your new PIN"}
          </p>
          <NumberPad value={entry} onChange={setEntry} maxLength={PIN_LENGTH} shake={shake} />
          <p className={`text-sm text-red-400 ${mismatch ? "opacity-100" : "opacity-0"}`}>
            PINs didn&apos;t match, try again
          </p>
          <button type="button" onClick={cancel} className="text-sm text-muted">
            Cancel
          </button>
        </div>
      )}

      {hasPin && phase === "idle" && (
        <button type="button" onClick={remove} className="mt-2 block text-xs text-red-400">
          Remove PIN
        </button>
      )}
    </div>
  );
}
