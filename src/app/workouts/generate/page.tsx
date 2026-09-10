import { createClient } from "@/lib/supabase/server";
import { getSubscription, isPremiumStatus } from "@/lib/subscription";
import PlanGeneratorFlow from "@/components/PlanGeneratorFlow";

export default async function GeneratePlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: exercises }, subscription] = await Promise.all([
    supabase.from("exercises").select("*").order("name"),
    getSubscription(user!.id),
  ]);

  return <PlanGeneratorFlow exercises={exercises ?? []} isPremium={isPremiumStatus(subscription?.status)} />;
}
