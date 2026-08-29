"use client";

import { useEffect, useState } from "react";
import NumberPad from "@/components/NumberPad";

const STORAGE_KEY = "racked_pin";
const PIN_LENGTH = 4;

export default function PinGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [entry, setEntry] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const pin = localStorage.getItem(STORAGE_KEY);
    const unlocked = sessionStorage.getItem("racked_unlocked") === "1";
    setLocked(Boolean(pin) && !unlocked);
    setReady(true);
  }, []);

  useEffect(() => {
    if (entry.length < PIN_LENGTH) return;
    const pin = localStorage.getItem(STORAGE_KEY);
    if (entry === pin) {
      sessionStorage.setItem("racked_unlocked", "1");
      setLocked(false);
    } else {
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setEntry("");
      }, 350);
    }
  }, [entry]);

  if (!ready) return null;

  if (!locked) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-xl font-bold">Racked is locked</h1>
        <p className="mt-1 text-sm text-muted">Enter your PIN to continue</p>
      </div>
      <NumberPad value={entry} onChange={setEntry} maxLength={PIN_LENGTH} shake={shake} />
      <p className={`text-sm text-red-400 ${shake ? "opacity-100" : "opacity-0"}`}>Incorrect PIN</p>
    </div>
  );
}
