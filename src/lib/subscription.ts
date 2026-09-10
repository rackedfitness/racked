import { createClient } from "@/lib/supabase/server";

export type SubscriptionStatus = "none" | "trialing" | "active" | "past_due" | "canceled";

export type Subscription = {
  status: SubscriptionStatus;
  platform: "web" | "ios" | "android";
  current_period_end: string | null;
  stripe_customer_id: string | null;
};

export function isPremiumStatus(status: SubscriptionStatus | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("status, platform, current_period_end, stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data as Subscription | null;
}
