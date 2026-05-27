"use client";

import { useActionState, useMemo, useState } from "react";
import { useLocale, useMessages, useTranslations } from "next-intl";
import {
  saveProduct,
  type ProductActionState,
} from "@/app/[locale]/maker/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FairDealPreview } from "@/components/maker/fair-deal-preview";
import { PRODUCT_CATEGORIES, PROBLEM_TAGS } from "@/lib/products";

export type ProductFormDefaults = {
  id?: string;
  name: string;
  description: string;
  price: string;
  billing_type: "one_time" | "subscription";
  trial_days: number;
  trial_terms: string;
  cancel_url: string;
  refund_template_id: number;
  refund_supplement: string;
  refund_policy_custom: string;
  cancel_policy_ack: boolean;
  delivery_url: string;
  lemon_squeezy_url: string;
  category: string;
  problem_tags: string[];
};

const initialActionState: ProductActionState = {};

function FieldError({
  errors,
}: {
  errors?: string[];
}) {
  if (!errors?.length) return null;
  return <p className="text-sm text-destructive">{errors[0]}</p>;
}

export function ProductForm({
  defaults,
  productId,
}: {
  defaults: ProductFormDefaults;
  productId?: string;
}) {
  const t = useTranslations("form");
  const tCard = useTranslations("card");
  const locale = useLocale();
  const messages = useMessages();
  const refundTemplates = messages.refundTemplates as Record<
    string,
    { label: string; body?: string }
  >;

  const [state, formAction, pending] = useActionState(
    saveProduct,
    initialActionState
  );

  const [name, setName] = useState(defaults.name);
  const [billingType, setBillingType] = useState(defaults.billing_type);
  const [trialDays, setTrialDays] = useState(defaults.trial_days);
  const [templateId, setTemplateId] = useState(defaults.refund_template_id);
  const [description, setDescription] = useState(defaults.description);
  const [price, setPrice] = useState(defaults.price);
  const [cancelUrl, setCancelUrl] = useState(defaults.cancel_url);
  const [refundSupplement, setRefundSupplement] = useState(defaults.refund_supplement);
  const [refundPolicyCustom, setRefundPolicyCustom] = useState(
    defaults.refund_policy_custom
  );
  const [trialTerms, setTrialTerms] = useState(defaults.trial_terms);
  const [cancelPolicyAck, setCancelPolicyAck] = useState(defaults.cancel_policy_ack);
  const [lemonSqueezyUrl, setLemonSqueezyUrl] = useState(defaults.lemon_squeezy_url);
  const [category, setCategory] = useState(defaults.category);
  const [problemTags, setProblemTags] = useState<string[]>(defaults.problem_tags);

  const fieldErrors = state.fieldErrors ?? {};
  const isCustomRefund = templateId === 4;

  const descriptionHint = useMemo(() => {
    const len = description.length;
    if (len >= 80) return t("descriptionHintOk", { n: len });
    return t("descriptionHintNeed", { n: len, need: 80 - len });
  }, [description, t]);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="locale" value={locale} />
      {productId && (
        <input type="hidden" name="product_id" value={productId} />
      )}

      {state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
          {state.fairDealReasons && state.fairDealReasons.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-1">
              {state.fairDealReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("sectionBasic")}</h2>
        <div className="space-y-2">
          <Label htmlFor="name">{t("name")}</Label>
          <Input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
          />
          <FieldError errors={fieldErrors.name} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description">{t("description")}</Label>
            <span className="text-xs text-muted-foreground">
              {descriptionHint}
            </span>
          </div>
          <Textarea
            id="description"
            name="description"
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
          />
          <FieldError errors={fieldErrors.description} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">{t("price")}</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="19"
            />
            <FieldError errors={fieldErrors.price} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing_type">{t("billingType")}</Label>
            <select
              id="billing_type"
              name="billing_type"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={billingType}
              onChange={(e) =>
                setBillingType(e.target.value as "one_time" | "subscription")
              }
            >
              <option value="one_time">{tCard("oneTime")}</option>
              <option value="subscription">{tCard("subscription")}</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="trial_days">{t("trialDays")}</Label>
            <Input
              id="trial_days"
              name="trial_days"
              type="number"
              min="0"
              defaultValue={defaults.trial_days}
              onChange={(e) => setTrialDays(Number(e.target.value))}
            />
          </div>
          {trialDays > 0 && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="trial_terms">{t("trialTerms")}</Label>
              <Textarea
                id="trial_terms"
                name="trial_terms"
                rows={3}
                value={trialTerms}
                onChange={(e) => setTrialTerms(e.target.value)}
                placeholder={t("trialTermsPlaceholder")}
              />
              <FieldError errors={fieldErrors.trial_terms} />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="delivery_url">{t("deliveryUrl")}</Label>
          <Input
            id="delivery_url"
            name="delivery_url"
            type="url"
            defaultValue={defaults.delivery_url}
            placeholder={t("deliveryPlaceholder")}
          />
          <FieldError errors={fieldErrors.delivery_url} />
        </div>

        {/* LemonSqueezy 購入リンク */}
        <div className="rounded-xl border border-yellow-200 bg-yellow-50/60 p-4 space-y-3 dark:border-yellow-800/40 dark:bg-yellow-900/10">
          <div className="flex items-start gap-2">
            <span className="text-lg">🍋</span>
            <div>
              <h3 className="text-sm font-semibold">{t("lsUrlLabel")}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("lsUrlHint")}</p>
            </div>
          </div>
          <Input
            id="lemon_squeezy_url"
            name="lemon_squeezy_url"
            type="url"
            required
            value={lemonSqueezyUrl}
            onChange={(e) => setLemonSqueezyUrl(e.target.value)}
            placeholder="https://your-store.lemonsqueezy.com/buy/..."
            className="bg-white dark:bg-background"
          />
          <FieldError errors={fieldErrors.lemon_squeezy_url} />
          {lemonSqueezyUrl && (
            <p className="text-xs text-muted-foreground">
              {t("lsUrlSetup")}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("sectionDiscovery")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">{t("categoryLabel")}</Label>
            <select
              id="category"
              name="category"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">{t("categoryPlaceholder")}</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t("problemTagsLabel")}</Label>
          <div className="flex flex-wrap gap-2">
            {PROBLEM_TAGS.map((tag) => {
              const checked = problemTags.includes(tag);
              return (
                <label
                  key={tag}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors select-none ${
                    checked
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  } ${!checked && problemTags.length >= 3 ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="checkbox"
                    name="problem_tags"
                    value={tag}
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (problemTags.length < 3) {
                          setProblemTags([...problemTags, tag]);
                        }
                      } else {
                        setProblemTags(problemTags.filter((t) => t !== tag));
                      }
                    }}
                    className="sr-only"
                  />
                  {tag}
                </label>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("sectionFairDeal")}</h2>
        <p className="text-sm text-muted-foreground">{t("fairDealHint")}</p>

        <FairDealPreview
          name={name}
          description={description}
          price={price}
          billingType={billingType}
          cancelUrl={cancelUrl}
          templateId={templateId}
          refundSupplement={refundSupplement}
          refundPolicyCustom={refundPolicyCustom}
          cancelPolicyAck={cancelPolicyAck}
          trialDays={trialDays}
          trialTerms={trialTerms}
        />

        <div className="space-y-2">
          <Label htmlFor="cancel_url">{t("cancelUrl")}</Label>
          <Input
            id="cancel_url"
            name="cancel_url"
            type="url"
            required
            value={cancelUrl}
            onChange={(e) => setCancelUrl(e.target.value)}
            placeholder={t("cancelPlaceholder")}
          />
          <FieldError errors={fieldErrors.cancel_url} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="refund_template_id">{t("refundTemplate")}</Label>
          <select
            id="refund_template_id"
            name="refund_template_id"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={templateId}
            onChange={(e) => setTemplateId(Number(e.target.value))}
          >
            {Object.entries(refundTemplates)
              .filter(([id]) => id !== "4")
              .map(([id, tmpl]) => (
                <option key={id} value={id}>
                  {tmpl.label}
                </option>
              ))}
            <option value={4}>{refundTemplates["4"]?.label}</option>
          </select>
        </div>

        {!isCustomRefund && (
          <div className="space-y-2">
            <p className="rounded-lg bg-muted/50 p-3 text-xs whitespace-pre-wrap text-muted-foreground">
              {refundTemplates[String(templateId)]?.body}
            </p>
            <Label htmlFor="refund_supplement">{t("refundSupplement")}</Label>
            <Textarea
              id="refund_supplement"
              name="refund_supplement"
              rows={3}
              value={refundSupplement}
              onChange={(e) => setRefundSupplement(e.target.value)}
              placeholder={t("refundSupplementPlaceholder")}
            />
            <FieldError errors={fieldErrors.refund_supplement} />
          </div>
        )}

        {isCustomRefund && (
          <div className="space-y-2">
            <Label htmlFor="refund_policy_custom">{t("refundCustom")}</Label>
            <Textarea
              id="refund_policy_custom"
              name="refund_policy_custom"
              rows={6}
              value={refundPolicyCustom}
              onChange={(e) => setRefundPolicyCustom(e.target.value)}
              placeholder={t("refundCustomPlaceholder")}
            />
            <FieldError errors={fieldErrors.refund_policy_custom} />
          </div>
        )}

        {billingType === "subscription" && (
          <label className="flex items-start gap-3 rounded-lg border p-4">
            <Checkbox
              name="cancel_policy_ack"
              checked={cancelPolicyAck}
              onCheckedChange={(checked) => setCancelPolicyAck(checked)}
              value="on"
            />
            <span className="text-sm leading-snug">
              {t("subAck")}
            </span>
          </label>
        )}
        <FieldError errors={fieldErrors.cancel_policy_ack} />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          name="intent"
          value="draft"
          variant="outline"
          disabled={pending}
          className="sm:flex-1"
        >
          {pending ? t("saving") : t("saveDraft")}
        </Button>
        <Button
          type="submit"
          name="intent"
          value="publish"
          disabled={pending}
          className="sm:flex-1"
        >
          {pending ? t("publishing") : t("publish")}
        </Button>
      </div>
    </form>
  );
}
