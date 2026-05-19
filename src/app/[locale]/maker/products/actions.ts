"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateFairDeal } from "@/lib/fair-deal";
import { buildRefundPolicy } from "@/lib/refund-templates";
import { redirect } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import {
  parseProductDraft,
  parseProductForm,
} from "@/lib/validations/product";
import type { ValidationMessages } from "@/lib/validations/product";
import en from "../../../../../messages/en.json";
import ja from "../../../../../messages/ja.json";
import type { ZodIssue } from "zod";

export type ProductActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  fairDealReasons?: string[];
};

const validationByLocale: Record<Locale, ValidationMessages> = {
  en: en.validation,
  ja: ja.validation,
};

function fieldErrorsFromZod(issues: ZodIssue[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "_form");
    map[key] = [...(map[key] ?? []), issue.message];
  }
  return map;
}

function revalidateAll(path: string) {
  for (const loc of routing.locales) {
    revalidatePath(`/${loc}${path === "/" ? "" : path}`);
  }
}

async function requireMaker(locale: Locale) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?next=/maker/products/new`);
  }
  return { supabase, user: user! };
}

export async function saveProduct(
  _prev: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const locale = (formData.get("locale")?.toString() ||
    (await getLocale())) as Locale;
  const v = validationByLocale[locale] ?? validationByLocale.en;
  const tForm = await getTranslations({ locale, namespace: "form" });
  const tFair = await getTranslations({ locale, namespace: "fairDeal" });

  const intent = formData.get("intent");
  const productId = formData.get("product_id")?.toString() || undefined;
  const isPublish = intent === "publish";

  const parsed = isPublish
    ? parseProductForm(formData, v)
    : parseProductDraft(formData, v);
  if (!parsed.success) {
    return {
      error: tForm("errorCheck"),
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  const data = parsed.data;
  const { supabase, user } = await requireMaker(locale);

  const templateId = data.refund_template_id;
  const { policy: refundPolicy, templateId: storedTemplateId } =
    buildRefundPolicy(
      locale,
      templateId,
      data.refund_policy_custom ?? "",
      data.refund_supplement ?? ""
    );

  const priceNum = Number(data.price);
  const priceCents = Math.round(
    (Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 1) * 100
  );
  const cancelPolicyAck = Boolean(data.cancel_policy_ack);
  const trialTerms =
    data.trial_days > 0 ? (data.trial_terms ?? "").trim() : null;
  const deliveryUrl = data.delivery_url?.trim() || null;

  const status = isPublish ? "published" : "draft";
  const now = new Date().toISOString();

  const fairDealResult = evaluateFairDeal({
    name: data.name,
    description: data.description,
    price_cents: priceCents,
    billing_type: data.billing_type,
    cancel_url: data.cancel_url,
    refund_policy: refundPolicy,
    refund_policy_template_id: storedTemplateId,
    refund_supplement: data.refund_supplement ?? "",
    cancel_policy_ack: cancelPolicyAck,
    trial_days: data.trial_days,
    trial_terms: trialTerms,
    status,
  });

  const fairDealMessages = fairDealResult.reasonKeys.map((key) =>
    tFair(key)
  );

  if (isPublish && !fairDealResult.ok) {
    return {
      error: tForm("errorFairDeal"),
      fairDealReasons: fairDealMessages,
      fieldErrors: {},
    };
  }

  const row = {
    name: data.name.trim(),
    description: data.description.trim(),
    price_cents: priceCents,
    currency: "usd",
    billing_type: data.billing_type,
    trial_days: data.trial_days,
    trial_terms: trialTerms,
    cancel_url: data.cancel_url.trim(),
    refund_policy: refundPolicy,
    refund_policy_template_id: storedTemplateId,
    cancel_policy_ack: cancelPolicyAck,
    delivery_url: deliveryUrl,
    status,
    fair_deal: isPublish && fairDealResult.ok,
    fair_deal_fail_reasons: fairDealResult.ok ? [] : fairDealMessages,
    fair_deal_checked_at: now,
  };

  if (productId) {
    const { data: existing } = await supabase
      .from("products")
      .select("id, maker_id, published_at")
      .eq("id", productId)
      .single();

    if (!existing || existing.maker_id !== user.id) {
      return { error: tForm("errorNotFound") };
    }

    const publishFields =
      isPublish && !existing.published_at
        ? {
            published_at: now,
            early_backer_ends_at: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          }
        : {};

    const { error } = await supabase
      .from("products")
      .update({ ...row, ...publishFields })
      .eq("id", productId);

    if (error) return { error: error.message };

    revalidateAll("/");
    revalidateAll(`/products/${productId}`);
    revalidateAll("/maker");

    if (isPublish) redirect(`/${locale}/products/${productId}`);
    redirect(`/${locale}/maker/products/${productId}/edit?saved=draft`);
  }

  const publishFields = isPublish
    ? {
        published_at: now,
        early_backer_ends_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }
    : {};

  const { data: created, error } = await supabase
    .from("products")
    .insert({
      maker_id: user.id,
      ...row,
      ...publishFields,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidateAll("/");
  revalidateAll("/maker");

  if (isPublish) redirect(`/${locale}/products/${created.id}`);
  redirect(`/${locale}/maker/products/${created.id}/edit?saved=draft`);
}
