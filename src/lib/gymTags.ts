// Fixed vocabulary rather than free-tagging, so the aggregate counts shown
// on a gym's page ("Squat rack · 4") stay meaningful across many reviewers.
export const GYM_TAGS = [
  { value: "hotel_gym", label: "Hotel gym", emoji: "🏨" },
  { value: "squat_rack", label: "Squat rack", emoji: "🏋️" },
  { value: "barbells", label: "Barbells", emoji: "🔩" },
  { value: "heavy_dumbbells", label: "Heavy dumbbells (40kg+)", emoji: "💪" },
  { value: "cardio", label: "Cardio machines", emoji: "🏃" },
  { value: "machines", label: "Good machine selection", emoji: "⚙️" },
  { value: "24_hour", label: "Open 24 hours", emoji: "🌙" },
  { value: "day_pass", label: "Day passes available", emoji: "🎟️" },
  { value: "clean", label: "Clean & well-maintained", emoji: "✨" },
  { value: "crowded", label: "Gets crowded", emoji: "👥" },
] as const;

export type GymTagValue = (typeof GYM_TAGS)[number]["value"];

export function gymTagLabel(value: string) {
  return GYM_TAGS.find((t) => t.value === value)?.label ?? value;
}

export function gymTagEmoji(value: string) {
  return GYM_TAGS.find((t) => t.value === value)?.emoji ?? "";
}
