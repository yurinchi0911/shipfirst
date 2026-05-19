import { z } from "zod";
import type en from "../../../messages/en.json";

export type ValidationMessages = (typeof en)["validation"];

const optionalUrl = (v: ValidationMessages) =>
  z
    .string()
    .optional()
    .transform((s) => (s ?? "").trim())
    .refine((s) => s === "" || z.string().url().safeParse(s).success, {
      message: v.urlInvalid,
    });

export function createProductDraftSchema(v: ValidationMessages) {
  return z.object({
    name: z.string().min(1, v.nameRequired),
    description: z.string().default(""),
    price: z.string().default("1"),
    billing_type: z.enum(["one_time", "subscription"]).default("one_time"),
    trial_days: z.coerce.number().int().min(0).max(365).default(0),
    trial_terms: z.string().optional(),
    cancel_url: z.string().default("https://"),
    refund_template_id: z.coerce.number().int().min(1).max(4).default(4),
    refund_supplement: z.string().optional(),
    refund_policy_custom: z.string().optional(),
    cancel_policy_ack: z
      .union([z.literal("on"), z.literal("true"), z.undefined()])
      .optional(),
    delivery_url: optionalUrl(v),
  });
}

export function createProductFormSchema(v: ValidationMessages) {
  return z
    .object({
      name: z.string().min(3, v.nameMin),
      description: z.string().min(80, v.descriptionMin),
      price: z
        .string()
        .min(1, v.priceRequired)
        .refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
          message: v.pricePositive,
        }),
      billing_type: z.enum(["one_time", "subscription"]),
      trial_days: z.coerce.number().int().min(0).max(365),
      trial_terms: z.string().optional(),
      cancel_url: z
        .string()
        .url(v.urlInvalid)
        .refine((u) => u.startsWith("https://"), { message: v.urlHttps }),
      refund_template_id: z.coerce.number().int().min(1).max(4),
      refund_supplement: z.string().optional(),
      refund_policy_custom: z.string().optional(),
      cancel_policy_ack: z
        .union([z.literal("on"), z.literal("true"), z.undefined()])
        .optional(),
      delivery_url: optionalUrl(v),
    })
    .superRefine((data, ctx) => {
      if (data.trial_days > 0) {
        const terms = (data.trial_terms ?? "").trim();
        if (terms.length < 50) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: v.trialTermsMin,
            path: ["trial_terms"],
          });
        }
      }

      if (data.billing_type === "subscription" && !data.cancel_policy_ack) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: v.ackRequired,
          path: ["cancel_policy_ack"],
        });
      }

      if (data.refund_template_id === 4) {
        const custom = (data.refund_policy_custom ?? "").trim();
        if (custom.length < 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: v.refundCustomMin,
            path: ["refund_policy_custom"],
          });
        }
      } else {
        const supplement = (data.refund_supplement ?? "").trim();
        if (supplement.length > 0 && supplement.length < 30) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: v.supplementMin,
            path: ["refund_supplement"],
          });
        }
      }
    });
}

function rawFromForm(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    billing_type: formData.get("billing_type"),
    trial_days: formData.get("trial_days") ?? "0",
    trial_terms: formData.get("trial_terms") ?? "",
    cancel_url: formData.get("cancel_url"),
    refund_template_id: formData.get("refund_template_id") ?? "4",
    refund_supplement: formData.get("refund_supplement") ?? "",
    refund_policy_custom: formData.get("refund_policy_custom") ?? "",
    cancel_policy_ack: formData.get("cancel_policy_ack") ?? undefined,
    delivery_url: formData.get("delivery_url") ?? "",
  };
}

export function parseProductForm(formData: FormData, v: ValidationMessages) {
  return createProductFormSchema(v).safeParse(rawFromForm(formData));
}

export function parseProductDraft(formData: FormData, v: ValidationMessages) {
  return createProductDraftSchema(v).safeParse(rawFromForm(formData));
}
