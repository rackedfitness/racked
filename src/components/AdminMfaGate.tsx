"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode =
  | { kind: "loading" }
  | { kind: "enroll"; factorId: string; qrCode: string; secret: string }
  | { kind: "verify"; factorId: string }
  | { kind: "failed"; message: string };

// Admin actions require a two-factor (aal2) session. First visit: enroll an
// authenticator app (TOTP). Later visits: enter a code to step this session
// up to aal2. On success the session cookie is refreshed with the aal2 token
// and the server-rendered admin page re-checks it.
export default function AdminMfaGate() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) {
        setMode({ kind: "failed", message: listError.message });
        return;
      }

      const verified = data.totp[0];
      if (verified) {
        setMode({ kind: "verify", factorId: verified.id });
        return;
      }

      // A half-finished earlier enrollment would block re-enrolling.
      for (const f of data.all.filter((f) => f.status === "unverified")) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Racked admin",
      });
      if (enrollError || !enrolled) {
        setMode({ kind: "failed", message: enrollError?.message ?? "Couldn't start two-factor setup." });
        return;
      }
      setMode({ kind: "enroll", factorId: enrolled.id, qrCode: enrolled.totp.qr_code, secret: enrolled.totp.secret });
    })();
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (mode.kind !== "enroll" && mode.kind !== "verify") return;
    setVerifying(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: mode.factorId,
      code: code.trim(),
    });
    setVerifying(false);

    if (verifyError) {
      setError("That code didn't work — check your authenticator app and try again.");
      return;
    }
    router.refresh();
  }

  if (mode.kind === "loading") {
    return <p className="text-sm text-muted">Checking two-factor status…</p>;
  }
  if (mode.kind === "failed") {
    return (
      <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-400">
        Two-factor setup failed: {mode.message}
      </p>
    );
  }

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-4 rounded-lg border border-card-border bg-card p-4">
      {mode.kind === "enroll" ? (
        <>
          <div>
            <h2 className="font-semibold">Set up two-factor sign-in</h2>
            <p className="text-sm text-muted">
              Admin tools require it. Scan this with an authenticator app (Google Authenticator, 1Password, Authy…),
              then enter the 6-digit code.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mode.qrCode} alt="Two-factor setup QR code" className="mx-auto h-48 w-48 rounded-md bg-white p-2" />
          <p className="text-center text-xs text-muted">
            Can&rsquo;t scan? Enter this key manually: <span className="font-mono break-all">{mode.secret}</span>
          </p>
        </>
      ) : (
        <div>
          <h2 className="font-semibold">Two-factor verification</h2>
          <p className="text-sm text-muted">Enter the 6-digit code from your authenticator app to open admin tools.</p>
        </div>
      )}

      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        aria-label="Authentication code"
        className="tnum rounded-md border border-card-border bg-background px-3 py-2 text-center text-lg tracking-widest text-foreground"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={code.length !== 6 || verifying}
        className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-ink disabled:opacity-60"
      >
        {verifying ? "Verifying…" : "Verify"}
      </button>
    </form>
  );
}
