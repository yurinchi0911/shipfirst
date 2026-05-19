export type ProductStatus = "draft" | "published" | "archived";

export type MakerProductItem = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  billing_type: "one_time" | "subscription";
  fair_deal: boolean;
  status: ProductStatus;
  published_at: string | null;
  purchase_count: number;
  updated_at: string;
};

export type ProductListItem = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  billing_type: "one_time" | "subscription";
  fair_deal: boolean;
  published_at: string | null;
  early_backer_ends_at: string | null;
  early_backer_purchase_cap: number;
  purchase_count: number;
};

export type ProductDetail = ProductListItem & {
  cancel_url: string;
  refund_policy: string;
  trial_days: number;
  trial_terms: string | null;
  delivery_url: string | null;
};

export function formatPrice(priceCents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(priceCents / 100);
}

export function billingLabel(type: ProductListItem["billing_type"]): string {
  return type === "subscription" ? "月額サブスク" : "買い切り";
}

export function isEarlyBackerActive(
  product: Pick<
    ProductListItem,
    | "published_at"
    | "early_backer_ends_at"
    | "early_backer_purchase_cap"
    | "purchase_count"
  >
): boolean {
  if (!product.published_at || !product.early_backer_ends_at) return false;
  const now = Date.now();
  const ends = new Date(product.early_backer_ends_at).getTime();
  return now < ends && product.purchase_count < product.early_backer_purchase_cap;
}

export function earlyBackerSlotsLeft(
  product: Pick<ProductListItem, "early_backer_purchase_cap" | "purchase_count">
): number {
  return Math.max(0, product.early_backer_purchase_cap - product.purchase_count);
}

export function truncateDescription(text: string, max = 120): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}
