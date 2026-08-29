import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { follow, unfollow } from "@/app/social/actions";
import { workoutVolume, formatVolume, computeStreakDays, computeBestEverMap, type WorkoutLite } from "@/lib/stats";
import { computeAllLiftRanks, bestOverallRank, type Sex } from "@/lib/rankSystem";
import RankSection from "@/components/RankSection";
import Avatar from "@/components/Avatar";
import { GearIcon } from "@/components/UIIcons";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, sex, age, avatar_url")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const isSelf = user?.id === profile.id;

  const { data: existingFollow } = isSelf
    ? { data: null }
    : await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user?.id ?? "")
        .eq("following_id", profile.id)
        .maybeSingle();

  const isFollowing = Boolean(existingFollow);

  const { data: rawWorkouts } = await supabase
    .from("workouts")
    .select(
      "id, title, started_at, finished_at, workout_exercises(exercise_id, workout_sets(weight, reps, is_warmup))"
    )
    .eq("user_id", profile.id)
    .not("finished_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(30);

  const workouts = (rawWorkouts ?? []) as unknown as WorkoutLite[];
  const totalVolume = workouts.reduce((sum, w) => sum + workoutVolume(w), 0);
  const streak = computeStreakDays(workouts);

  const { data: latestMeasurement } = await supabase
    .from("body_measurements")
    .select("weight_kg")
    .eq("user_id", profile.id)
    .not("weight_kg", "is", null)
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: exercises } = await supabase.from("exercises").select("id, name");
  const exerciseNames = Object.fromEntries((exercises ?? []).map((e) => [e.id, e.name]));

  const bodyweightKg = latestMeasurement?.weight_kg ?? null;
  const canRank = Boolean(bodyweightKg && profile.age && profile.sex);

  const liftRanks = canRank
    ? computeAllLiftRanks({
        bestEver: computeBestEverMap(workouts),
        exerciseNames,
        bodyweightKg: bodyweightKg!,
        age: profile.age!,
        sex: profile.sex as Sex,
      })
    : [];
  const topRank = bestOverallRank(liftRanks);

  const { count: followerCount } = await supabase
    .from("follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("following_id", profile.id);

  const { count: followingCount } = await supabase
    .from("follows")
    .select("following_id", { count: "exact", head: true })
    .eq("follower_id", profile.id);

  const action = isFollowing ? unfollow.bind(null, profile.id) : follow.bind(null, profile.id);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar url={profile.avatar_url} name={profile.display_name ?? profile.username} size="lg" />
          <div>
            <h1 className="text-xl font-bold">{profile.display_name ?? profile.username}</h1>
            <p className="text-sm text-muted">@{profile.username}</p>
          </div>
        </div>
        {isSelf ? (
          <Link
            href="/settings"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-card-border text-muted active:bg-card"
            aria-label="Settings"
          >
            <GearIcon size={20} />
          </Link>
        ) : (
          <form action={action}>
            <button
              type="submit"
              className={
                isFollowing
                  ? "rounded-full border border-card-border px-3 py-1.5 text-sm font-medium text-muted"
                  : "glow-accent-sm rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-accent-ink"
              }
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          </form>
        )}
      </div>

      <div className="tnum flex gap-6 text-sm">
        <Link href={`/profile/${profile.username}/followers`}>
          {followerCount ?? 0} <span className="font-sans font-normal text-muted">followers</span>
        </Link>
        <Link href={`/profile/${profile.username}/following`}>
          {followingCount ?? 0} <span className="font-sans font-normal text-muted">following</span>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-card-border bg-card p-3">
          <p className="tnum text-xl">{workouts.length}</p>
          <p className="text-xs text-muted">Workouts</p>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-3">
          <p className="tnum text-xl">{formatVolume(totalVolume)}</p>
          <p className="text-xs text-muted">Volume</p>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-3">
          <p className="tnum text-xl">{streak}</p>
          <p className="text-xs text-muted">Day streak</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Rank</h2>
        {!canRank ? (
          <div className="rounded-lg border border-dashed border-card-border p-4 text-center text-sm text-muted">
            {isSelf ? (
              <>
                Add your sex and age in{" "}
                <Link href="/settings" className="text-accent underline">
                  Settings
                </Link>{" "}
                and log your bodyweight in{" "}
                <Link href="/progress" className="text-accent underline">
                  Progress
                </Link>{" "}
                to unlock ranks.
              </>
            ) : (
              "This lifter hasn't set up ranks yet."
            )}
          </div>
        ) : liftRanks.length === 0 || !topRank ? (
          <p className="text-sm text-muted">
            Log a bench press, squat, deadlift, or overhead press to earn your first rank.
          </p>
        ) : (
          <RankSection topRank={topRank} liftRanks={liftRanks} />
        )}
      </div>

      <div className="flex flex-col gap-3">
        {(workouts ?? []).map((w) => (
          <Link
            key={w.id}
            href={`/workout/${w.id}`}
            className="rounded-lg border border-card-border bg-card p-4 hover:border-accent"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{w.title}</h2>
              <span className="text-xs text-muted">
                {new Date(w.started_at).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}

        {(!workouts || workouts.length === 0) && (
          <p className="text-sm text-muted">
            {isSelf ? "You haven't logged a workout yet." : "No visible workouts yet."}
          </p>
        )}
      </div>
    </div>
  );
}
