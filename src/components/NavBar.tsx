import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

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

  return <BottomNav username={profile?.username ?? null} />;
}
