"use client";

import { useRef, useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateAvatar } from "@/app/settings/actions";
import Avatar from "@/components/Avatar";

const LONG_PRESS_MS = 450;

export default function AvatarUpload({
  userId,
  avatarUrl,
  name,
}: {
  userId: string;
  avatarUrl: string | null;
  name: string;
}) {
  const [preview, setPreview] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startPress() {
    setPressing(true);
    pressTimer.current = setTimeout(() => {
      setPressing(false);
      inputRef.current?.click();
    }, LONG_PRESS_MS);
  }

  function cancelPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setPressing(false);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;

    try {
      await updateAvatar(url);
      setPreview(url);
    } catch (err) {
      // updateAvatar redirects to /login if the session is missing — let
      // that through instead of showing it as a save failure
      unstable_rethrow(err);
      setError(err instanceof Error ? err.message : "Failed to save photo");
    }
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Hold to change profile picture"
        className={`relative rounded-full transition-transform duration-150 ${pressing ? "scale-90" : ""}`}
        style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none", touchAction: "manipulation" }}
      >
        <Avatar url={preview} name={name} size="lg" />
        <span
          className={`pointer-events-none absolute inset-0 rounded-full ring-2 ring-accent transition-opacity duration-150 ${
            pressing ? "opacity-100" : "opacity-0"
          }`}
        />
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-xs text-white">
            ...
          </span>
        )}
      </button>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-medium text-accent"
        >
          Change photo
        </button>
        <p className="text-xs text-muted">or hold the photo</p>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
