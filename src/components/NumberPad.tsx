"use client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

export default function NumberPad({
  value,
  onChange,
  maxLength = 4,
  shake = false,
}: {
  value: string;
  onChange: (next: string) => void;
  maxLength?: number;
  shake?: boolean;
}) {
  function press(key: string) {
    if (key === "") return;
    if (key === "back") {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= maxLength) return;
    onChange(value + key);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={`flex gap-3 ${shake ? "animate-pin-shake" : ""}`}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border-2 transition-colors ${
              i < value.length ? "border-accent bg-accent" : "border-card-border bg-transparent"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key, i) => {
          if (key === "") return <div key={i} />;
          if (key === "back") {
            return (
              <button
                key={i}
                type="button"
                onClick={() => press(key)}
                aria-label="Backspace"
                className="tnum flex h-16 w-16 items-center justify-center rounded-full text-lg text-muted active:bg-card"
              >
                ⌫
              </button>
            );
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => press(key)}
              className="tnum flex h-16 w-16 items-center justify-center rounded-full border border-card-border bg-card text-2xl text-foreground active:border-accent active:bg-accent/15"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
