import type { ProductFormDefaults } from "@/components/maker/product-form";

export const EMPTY_PRODUCT_FORM: ProductFormDefaults = {
  name: "",
  description: "",
  price: "19",
  billing_type: "one_time",
  trial_days: 0,
  trial_terms: "",
  cancel_url: "https://",
  refund_template_id: 1,
  refund_supplement: "",
  refund_policy_custom: "",
  cancel_policy_ack: false,
  delivery_url: "",
};

type DbProduct = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  billing_type: "one_time" | "subscription";
  trial_days: number;
  trial_terms: string | null;
  cancel_url: string;
  refund_policy: string;
  refund_policy_template_id: number | null;
  cancel_policy_ack: boolean;
  delivery_url: string | null;
};

export function productToFormDefaults(product: DbProduct): ProductFormDefaults {
  const templateId = product.refund_policy_template_id ?? 4;

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: String(product.price_cents / 100),
    billing_type: product.billing_type,
    trial_days: product.trial_days,
    trial_terms: product.trial_terms ?? "",
    cancel_url: product.cancel_url,
    refund_template_id: templateId,
    refund_supplement: "",
    refund_policy_custom:
      templateId === 4 ? product.refund_policy : "",
    cancel_policy_ack: product.cancel_policy_ack,
    delivery_url: product.delivery_url ?? "",
  };
}
