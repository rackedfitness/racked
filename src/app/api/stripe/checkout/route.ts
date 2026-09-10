import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const origin = request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      // The webhook has no session cookies to identify the buyer — this is
      // how it links the Stripe subscription back to our user on every
      // future lifecycle event (renewal, cancellation), not just checkout.
      metadata: { supabase_user_id: user.id },
    },
    client_reference_id: user.id,
    customer_email: user.email,
    success_url: `${origin}/premium?checkout=success`,
    cancel_url: `${origin}/premium?checkout=canceled`,
  });

  return NextResponse.json({ url: session.url });
}
