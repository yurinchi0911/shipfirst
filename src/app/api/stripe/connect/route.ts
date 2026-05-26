import { NextResponse } from "next/server";
import { routing, type Locale } from "@/i18n/routing";
import { isStripeConfigured } from "@/lib/env";
import {
  createAccountOnboardingLink,
  createExpressAccount,
} from "@/lib/stripe/connect";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured on this server." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let locale: Locale = routing.defaultLocale;
  try {
    const body = (await request.json()) as { locale?: string };
    if (body.locale && routing.locales.includes(body.locale as Locale)) {
      locale = body.locale as Locale;
    }
  } catch {
    // body なしでも可
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  let stripeAccountId = profile?.stripe_account_id ?? null;

  if (!stripeAccountId) {
    try {
      stripeAccountId = await createExpressAccount(user.email);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stripe_account_id: stripeAccountId })
        .eq("id", user.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stripe account creation failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  try {
    const url = await createAccountOnboardingLink(stripeAccountId, locale);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Account link creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
