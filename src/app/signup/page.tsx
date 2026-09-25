import Link from "next/link";
import { signup } from "@/app/auth/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">Racked</h1>
        <p className="text-sm text-muted">Create an account to start logging workouts.</p>
      </div>

      {error && (
        <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      <form action={signup} className="flex flex-col gap-3">
        <input
          name="displayName"
          type="text"
          placeholder="Display name"
          required
          className="rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          minLength={6}
          className="rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted"
        />
        <label className="flex items-start gap-2 text-xs text-muted">
          <input
            name="agreeToTerms"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-card-border bg-card accent-accent"
          />
          <span>
            I&rsquo;m 13 or older, and I agree to Racked&rsquo;s{" "}
            <Link href="/terms" className="underline" target="_blank">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline" target="_blank">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-ink"
        >
          Sign up
        </button>
      </form>

      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
