import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import ActiveWorkoutBar from "@/components/ActiveWorkoutBar";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <>
      <ActiveWorkoutBar userId={user.id} />
      <BottomNav username={profile?.username ?? null} />
    </>
  );
}
