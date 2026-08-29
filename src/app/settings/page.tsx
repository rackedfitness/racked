import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/app/settings/actions";
import AvatarUpload from "@/components/AvatarUpload";
import AccentPicker from "@/components/AccentPicker";
import PinSettings from "@/components/PinSettings";
import ExportDataButton from "@/components/ExportDataButton";
import DeleteDataButton from "@/components/DeleteDataButton";
import { workoutVolume, type WorkoutLite } from "@/lib/stats";
import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { ArrowLeftIcon } from "@/components/UIIcons";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username, sex, age, avatar_url")
    .eq("id", user!.id)
    .single();

  const { data: rawWorkouts } = await supabase
    .from("workouts")
    .select("id, started_at, finished_at, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup))")
    .eq("user_id", user!.id)
    .not("finished_at", "is", null);

  const workouts = (rawWorkouts ?? []) as unknown as WorkoutLite[];
  const totalVolume = workouts.reduce((sum, w) => sum + workoutVolume(w), 0);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link href={`/profile/${profile?.username}`} className="text-muted">
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <AvatarUpload
        userId={user!.id}
        avatarUrl={profile?.avatar_url ?? null}
        name={profile?.display_name ?? profile?.username ?? "?"}
      />

      <form action={updateProfile} className="flex flex-col gap-3 rounded-lg border border-card-border bg-card p-4">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Display name</span>
          <input
            name="displayName"
            defaultValue={profile?.display_name ?? ""}
            className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Email</span>
          <input
            name="email"
            type="email"
            defaultValue={user?.email ?? ""}
            className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Sex</span>
            <select
              name="sex"
              defaultValue={profile?.sex ?? ""}
              className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Age</span>
            <input
              name="age"
              type="number"
              min={1}
              max={119}
              defaultValue={profile?.age ?? ""}
              className="tnum w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
        </div>
        <p className="text-xs text-muted">
          Sex and age are used to calculate your strength rank for major lifts.
        </p>
        <button
          type="submit"
          className="self-start rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink"
        >
          Save changes
        </button>
      </form>

      <div>
        <h2 className="mb-2 flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-muted">
          🔒 Security
        </h2>
        <PinSettings />
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-muted">
          🎨 Appearance
        </h2>
        <div className="rounded-lg border border-card-border bg-card p-4">
          <p className="mb-2 text-sm text-muted">Accent color</p>
          <AccentPicker />
        </div>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-muted">
          🗄 Your data
        </h2>
        <div className="flex flex-col gap-3 rounded-lg border border-card-border bg-card p-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="tnum text-xl">{workouts.length}</p>
              <p className="text-xs text-muted">Workouts logged</p>
            </div>
            <div>
              <p className="tnum text-xl">{Math.round(totalVolume)}kg</p>
              <p className="text-xs text-muted">Total volume</p>
            </div>
          </div>
          <ExportDataButton />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-red-400">
          ⚠ Danger zone
        </h2>
        <div className="rounded-lg border border-red-950 bg-card p-4">
          <DeleteDataButton />
        </div>
      </div>

      <form action={logout}>
        <button type="submit" className="text-sm text-muted underline">
          Log out
        </button>
      </form>
    </div>
  );
}
