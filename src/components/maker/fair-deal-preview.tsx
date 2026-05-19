"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BadgeCheck, CircleAlert } from "lucide-react";
import { evaluateFairDeal, type FairDealReasonKey } from "@/lib/fair-deal";
import { buildRefundPolicy } from "@/lib/refund-templates";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type FairDealPreviewProps = {
  name: string;
  description: string;
  price: string;
  billingType: "one_time" | "subscription";
  cancelUrl: string;
  templateId: number;
  refundSupplement: string;
  refundPolicyCustom: string;
  cancelPolicyAck: boolean;
  trialDays: number;
  trialTerms: string;
};

export function FairDealPreview(props: FairDealPreviewProps) {
  const t = useTranslations("form");
  const tFair = useTranslations("fairDeal");
  const locale = useLocale() as Locale;

  const result = useMemo(() => {
    const priceNum = Number.parseFloat(props.price);
    const priceCents = Math.round(
      (Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 0) * 100
    );
    const { policy, templateId } = buildRefundPolicy(
      locale,
      props.templateId,
      props.refundPolicyCustom,
      props.refundSupplement
    );

    return evaluateFairDeal({
      name: props.name,
      description: props.description,
      price_cents: priceCents,
      billing_type: props.billingType,
      cancel_url: props.cancelUrl,
      refund_policy: policy,
      refund_policy_template_id: templateId,
      refund_supplement: props.refundSupplement,
      cancel_policy_ack: props.cancelPolicyAck,
      trial_days: props.trialDays,
      trial_terms: props.trialDays > 0 ? props.trialTerms : null,
      status: "published",
    });
  }, [locale, props]);

  const reasons = result.reasonKeys.filter((k) => k !== "notPublished");

  return (
    <section
      className={cn(
        "rounded-xl border p-4 text-sm",
        result.ok
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-amber-500/30 bg-amber-500/5"
      )}
      aria-live="polite"
    >
      <span className="flex items-start gap-3">
        {result.ok ? (
          <BadgeCheck
            className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
        ) : (
          <CircleAlert
            className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
        )}
        <span className="min-w-0 space-y-2">
          <span className="block font-medium">
            {result.ok ? t("fairDealPreviewOk") : t("fairDealPreviewFail")}
          </span>
          <span className="block text-muted-foreground">
            {t("fairDealPreviewHint")}
          </span>
          {reasons.length > 0 && (
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              {reasons.map((key: FairDealReasonKey) => (
                <li key={key}>{tFair(key)}</li>
              ))}
            </ul>
          )}
        </span>
      </span>
    </section>
  );
}
