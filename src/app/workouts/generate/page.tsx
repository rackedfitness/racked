import { createClient } from "@/lib/supabase/server";
import PlanGeneratorFlow from "@/components/PlanGeneratorFlow";

export default async function GeneratePlanPage() {
  const supabase = await createClient();
  const { data: exercises } = await supabase.from("exercises").select("*").order("name");

  return <PlanGeneratorFlow exercises={exercises ?? []} />;
}
