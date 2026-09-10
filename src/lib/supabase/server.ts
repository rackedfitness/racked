import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { WeightUnit } from "@/lib/units";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component; safe to ignore
            // because middleware refreshes the session on every request.
          }
        },
      },
    }
  );
}

// auth.getUser() re-validates against Supabase's Auth server on every call
// (unlike getSession(), it never trusts the cookie alone) — a real network
// round trip. The root layout's NavBar and the page it's rendering both need
// the current user on every single navigation, so without this they each
// paid for that round trip separately. React's cache() dedupes calls to this
// function within one request, so it only actually happens once.
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// The viewer's own display-unit preference — used to render weights
// wherever they're shown, regardless of whose data it is. Cached the same
// way as getUser() since most pages that fetch it also fetch the user.
export const getWeightUnit = cache(async (): Promise<WeightUnit> => {
  const user = await getUser();
  if (!user) return "kg";
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("weight_unit").eq("id", user.id).single();
  return (data?.weight_unit as WeightUnit) ?? "kg";
});
