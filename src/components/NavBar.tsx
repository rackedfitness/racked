import { createClient, getUser } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import ActiveWorkoutBar from "@/components/ActiveWorkoutBar";

export default async function NavBar() {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();

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
