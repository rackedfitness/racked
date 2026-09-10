import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSubscription, isPremiumStatus } from "@/lib/subscription";
import { ArrowLeftIcon } from "@/components/UIIcons";
import PremiumActionButton from "@/components/PremiumActionButton";

const FEATURES = [
  "Generate a custom workout from a photo of the equipment you have, or a typed list of machines",
  "AI-generated multi-week periodized training programs",
  "Full strength-standard rankings on every lift, not just the core few",
  "Monthly and all-time leaderboards",
  "Share recap cards without the Racked wordmark",
];

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const subscription = await getSubscription(user!.id);
  const isPremium = isPremiumStatus(subscription?.status);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-bold">Racked Premium</h1>
      </div>

      {checkout === "success" && (
        <div className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-center text-sm text-accent">
          You&rsquo;re all set — welcome to Premium.
        </div>
      )}
      {checkout === "canceled" && (
        <div className="rounded-lg border border-card-border bg-card p-3 text-center text-sm text-muted">
          Checkout canceled — no charge was made.
        </div>
      )}

      <div className="rounded-lg border border-accent bg-accent/10 p-4">
        {isPremium ? (
          <>
            <p className="font-semibold text-accent">
              You&rsquo;re on Premium{subscription?.status === "trialing" ? " (free trial)" : ""}
            </p>
            {subscription?.current_period_end && (
              <p className="mt-1 text-sm text-muted">
                {subscription.status === "trialing" ? "Trial ends" : "Renews"}{" "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="font-semibold">$4.99/mo — 7-day free trial</p>
            <p className="mt-1 text-sm text-muted">Cancel any time during the trial and you won&rsquo;t be charged.</p>
          </>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 text-accent">✦</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {isPremium ? (
        <PremiumActionButton
          mode="portal"
          label="Manage subscription"
          className="rounded-md border border-card-border px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-foreground disabled:opacity-60"
        />
      ) : (
        <PremiumActionButton
          mode="checkout"
          label="Start free trial"
          className="glow-accent w-full rounded-md bg-accent px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-accent-ink disabled:opacity-60"
        />
      )}
    </div>
  );
}
