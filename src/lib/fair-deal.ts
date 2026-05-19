export type FairDealInput = {
  name: string;
  description: string;
  price_cents: number;
  billing_type: "one_time" | "subscription";
  cancel_url: string;
  refund_policy: string;
  refund_policy_template_id: number | null;
  refund_supplement?: string;
  cancel_policy_ack: boolean;
  trial_days: number;
  trial_terms: string | null;
  status: "draft" | "published";
};

export type FairDealReasonKey =
  | "nameShort"
  | "descriptionShort"
  | "priceInvalid"
  | "cancelUrlHttps"
  | "refundPolicy"
  | "subAck"
  | "trialTerms"
  | "notPublished";

export type FairDealResult = {
  ok: boolean;
  reasonKeys: FairDealReasonKey[];
};

export function evaluateFairDeal(input: FairDealInput): FairDealResult {
  const reasonKeys: FairDealReasonKey[] = [];

  if (input.name.trim().length < 3) reasonKeys.push("nameShort");
  if (input.description.trim().length < 80) reasonKeys.push("descriptionShort");
  if (input.price_cents <= 0) reasonKeys.push("priceInvalid");
  if (!input.cancel_url.trim().startsWith("https://")) {
    reasonKeys.push("cancelUrlHttps");
  }

  const policy = input.refund_policy.trim();
  const templateId = input.refund_policy_template_id;
  const supplement = (input.refund_supplement ?? "").trim();
  const policyOk =
    policy.length >= 100 ||
    (templateId !== null &&
      templateId >= 1 &&
      templateId <= 3 &&
      supplement.length >= 30);
  if (!policyOk) reasonKeys.push("refundPolicy");

  if (input.billing_type === "subscription" && !input.cancel_policy_ack) {
    reasonKeys.push("subAck");
  }

  if (input.trial_days > 0) {
    const terms = (input.trial_terms ?? "").trim();
    if (terms.length < 50) reasonKeys.push("trialTerms");
  }

  if (input.status !== "published") reasonKeys.push("notPublished");

  return { ok: reasonKeys.length === 0, reasonKeys };
}
