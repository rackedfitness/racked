"use server";

import { redirect } from "next/navigation";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { isPremiumStatus } from "@/lib/subscription";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

type GeneratedExercise = { name: string; sets: number; reps: number };

export async function generateWorkoutFromEquipment(input: { photoBase64?: string; machineNames?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!isPremiumStatus(subscription?.status)) {
    throw new Error("This feature is Premium only.");
  }

  const machineNames = input.machineNames?.trim();
  if (!input.photoBase64 && !machineNames) {
    throw new Error("Add a photo or list the machines you have.");
  }

  const { data: exercises } = await supabase.from("exercises").select("id, name").order("name");
  if (!exercises || exercises.length === 0) {
    throw new Error("No exercise library to generate from.");
  }
  const exerciseList = exercises.map((e) => e.name).join(", ");

  const content: Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam> = [];
  if (input.photoBase64) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: input.photoBase64 },
    });
  }
  content.push({
    type: "text",
    text: `You are a fitness coach building a single workout session from the equipment a gym member has access to.
${input.photoBase64 ? "Identify the gym equipment/machines visible in the attached photo. " : ""}${
      machineNames ? `The member says they have access to: ${machineNames}. ` : ""
    }
Using ONLY exercise names from this exact list (case-sensitive match required, pick the ones that best fit the available equipment): ${exerciseList}

Return ONLY a JSON array, no other text, of 5 to 8 exercises, each shaped exactly as:
{"name": "<exact name copied from the list above>", "sets": <integer 2-5>, "reps": <integer 5-15>}`,
  });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    messages: [{ role: "user", content }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("The AI didn't return a usable response — try again.");
  }

  let parsed: GeneratedExercise[];
  try {
    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : textBlock.text);
  } catch {
    throw new Error("Couldn't understand the generated workout — try again.");
  }

  // Never trust the model's exercise names as-is — only ones that exactly
  // match our own library can be inserted, since workout_template_exercises
  // requires a real exercise id.
  const exerciseByName = new Map(exercises.map((e) => [e.name.toLowerCase(), e]));
  const matched = parsed
    .map((p) => ({ exercise: exerciseByName.get((p.name ?? "").toLowerCase()), sets: p.sets, reps: p.reps }))
    .filter((p): p is { exercise: { id: string; name: string }; sets: number; reps: number } => Boolean(p.exercise));

  if (matched.length === 0) {
    throw new Error("Couldn't match the generated exercises to your library — try again.");
  }

  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .insert({ user_id: user.id, name: `AI Generated — ${new Date().toLocaleDateString()}` })
    .select("id")
    .single();
  if (templateError || !template) {
    throw new Error(templateError?.message ?? "Failed to save the generated plan");
  }

  const payload = matched.map((m, i) => ({
    template_id: template.id,
    exercise_id: m.exercise.id,
    order_index: i,
    target_sets: Math.min(5, Math.max(2, Math.round(m.sets) || 3)),
    target_reps: Math.min(20, Math.max(1, Math.round(m.reps) || 10)),
  }));

  const { error: exercisesError } = await supabase.from("workout_template_exercises").insert(payload);
  if (exercisesError) throw new Error(exercisesError.message);

  redirect(`/workout/new?template=${template.id}`);
}
