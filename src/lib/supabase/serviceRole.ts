import { createClient } from "@supabase/supabase-js";

// Bypasses RLS entirely — only for trusted server-to-server contexts with no
// user session to authenticate as, like the Stripe webhook handler. Never
// import this into anything reachable from a user-initiated request.
export function createServiceRoleClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
