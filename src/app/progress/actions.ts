"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toKg, type WeightUnit } from "@/lib/units";

export async function logMeasurement(formData: FormData) {
  const weight = formData.get("weightKg");
  const unit = (formData.get("unit") as WeightUnit | null) ?? "kg";
  const note = String(formData.get("note") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("body_measurements").insert({
    user_id: user.id,
    weight_kg: weight ? toKg(Number(weight), unit) : null,
    note: note || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/progress");
}
