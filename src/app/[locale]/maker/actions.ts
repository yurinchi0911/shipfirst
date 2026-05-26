"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";
import { GRADUATION_THRESHOLD_CENTS } from "@/lib/products";

type ActionResult = { error?: string; success?: boolean };

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function addMakerPost(
  body: string,
  productId?: string
): Promise<ActionResult> {
  const { supabase, user } = await requireAuth();
  if (!user) return { error: "login_required" };

  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 2000) return { error: "invalid_body" };

  const { error } = await supabase.from("maker_posts").insert({
    maker_id: user.id,
    body: trimmed,
    ...(productId ? { product_id: productId } : {}),
  });

  if (error) return { error: error.message };

  const locale = await getLocale();
  revalidatePath(`/${locale}/maker`);
  for (const loc of routing.locales) {
    revalidatePath(`/${loc}/makers/${user.id}`);
  }
  return { success: true };
}

export async function updateExternalRevenue(
  amountUsd: number
): Promise<ActionResult> {
  const { supabase, user } = await requireAuth();
  if (!user) return { error: "login_required" };

  if (!Number.isFinite(amountUsd) || amountUsd < 0) return { error: "invalid_amount" };

  const cents = Math.round(amountUsd * 100);
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_internal_revenue_cents, graduated_at")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "profile_not_found" };

  const totalNew = profile.total_internal_revenue_cents + cents;
  const shouldGraduate =
    !profile.graduated_at && totalNew >= GRADUATION_THRESHOLD_CENTS;

  const { error } = await supabase
    .from("profiles")
    .update({
      total_external_revenue_cents: cents,
      ...(shouldGraduate ? { graduated_at: new Date().toISOString() } : {}),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  const locale = await getLocale();
  revalidatePath(`/${locale}/maker`);
  return { success: true };
}
