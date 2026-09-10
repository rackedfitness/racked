"use client";

import { useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { generateWorkoutFromEquipment } from "@/app/workout/generate/actions";
import { resizeImageForAI } from "@/lib/imageResize";

export default function GenerateWorkoutForm() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [machineNames, setMachineNames] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const photoInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Image must be under 15MB.");
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleSubmit() {
    setError(null);
    if (!photoFile && !machineNames.trim()) {
      setError("Add a photo or list the machines you have.");
      return;
    }

    startTransition(async () => {
      try {
        const photoBase64 = photoFile ? await resizeImageForAI(photoFile) : undefined;
        await generateWorkoutFromEquipment({ photoBase64, machineNames: machineNames.trim() || undefined });
      } catch (err) {
        // generateWorkoutFromEquipment redirect()s on success, which works
        // by throwing — must let that through, not treat it as a failure
        unstable_rethrow(err);
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium">Photo of the equipment (optional)</p>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
        {photoPreview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt=""
              className="h-48 w-full rounded-md border border-card-border object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setPhotoFile(null);
                setPhotoPreview(null);
              }}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="w-full rounded-md border border-dashed border-card-border px-3 py-6 text-center text-sm text-muted active:border-accent"
          >
            + Add a photo
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Or list the machines you have (optional)</p>
        <textarea
          value={machineNames}
          onChange={(e) => setMachineNames(e.target.value)}
          placeholder="e.g. leg press, lat pulldown, cable crossover, treadmill"
          rows={3}
          className="w-full resize-none rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="glow-accent w-full rounded-md bg-accent px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-accent-ink disabled:opacity-60"
      >
        {isPending ? "Generating..." : "Generate workout"}
      </button>
    </div>
  );
}
