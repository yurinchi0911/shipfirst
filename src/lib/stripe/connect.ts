import type Stripe from "stripe";
import { getAppUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/i18n/routing";

export function isStripeOnboardingComplete(
  account: Stripe.Account
): boolean {
  return (
    account.details_submitted === true &&
    account.charges_enabled === true &&
    account.payouts_enabled === true
  );
}

export async function createExpressAccount(email: string): Promise<string> {
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      platform: "shipfirst",
    },
  });
  return account.id;
}

export async function createAccountOnboardingLink(
  stripeAccountId: string,
  locale: Locale
): Promise<string> {
  const stripe = getStripe();
  const base = `${getAppUrl()}/${locale}/maker`;
  const link = await stripe.accountLinks.create({
    account: stripeAccountId,
    type: "account_onboarding",
    refresh_url: `${base}?stripe=refresh`,
    return_url: `${base}?stripe=return`,
  });
  return link.url;
}

/** Stripe の状態を DB に反映（return_url 直後やメーカーページ表示時） */
export async function syncProfileOnboardingByAccountId(
  stripeAccountId: string
): Promise<boolean> {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(stripeAccountId);
  const complete = isStripeOnboardingComplete(account);

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      stripe_onboarding_complete: complete,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", stripeAccountId);

  if (error) throw error;
  return complete;
}

export async function handleAccountUpdated(account: Stripe.Account): Promise<void> {
  if (!account.id) return;
  const complete = isStripeOnboardingComplete(account);
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      stripe_onboarding_complete: complete,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", account.id);
}
