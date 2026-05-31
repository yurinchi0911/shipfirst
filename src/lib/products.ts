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
  category: string | null;
  problem_tags: string[];
  cheer_count: number;
  maker_id: string;
  maker: {
    display_name: string | null;
    total_internal_revenue_cents: number;
    total_external_revenue_cents: number;
    graduated_at: string | null;
  } | null;
};

export type ProductDetail = Omit<ProductListItem, "maker"> & {
  cancel_url: string;
  refund_policy: string;
  trial_days: number;
  trial_terms: string | null;
  delivery_url: string | null;
  lemon_squeezy_url: string | null;
  maker: {
    id: string;
    display_name: string | null;
  } | null;
};

export type DiscoveryTab = "new" | "popular" | "graduating";

export const PRODUCT_CATEGORIES = [
  "saas",
  "mobile",
  "extension",
  "notion",
  "ai",
  "devtool",
  "design",
  "other",
] as const;

export const PROBLEM_TAGS = [
  "productivity",
  "communication",
  "learning",
  "health",
  "business",
  "creative",
  "analytics",
  "other",
] as const;

/** $1,000 (100,000 cents) to graduate */
export const GRADUATION_THRESHOLD_CENTS = 100_000;
/** Show "approaching graduation" badge at 70% ($700) */
export const GRADUATING_THRESHOLD_CENTS = 70_000;

export function makerTotalRevenue(
  product: Pick<ProductListItem, "maker">
): number {
  if (!product.maker) return 0;
  return (
    product.maker.total_internal_revenue_cents +
    product.maker.total_external_revenue_cents
  );
}

export function isGraduating(product: Pick<ProductListItem, "maker">): boolean {
  const total = makerTotalRevenue(product);
  return total >= GRADUATING_THRESHOLD_CENTS && total < GRADUATION_THRESHOLD_CENTS;
}

export function formatPrice(priceCents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(priceCents / 100);
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

/** Full select string for discovery queries (products + maker join) */
export const PRODUCT_LIST_SELECT = `
  id, name, description, price_cents, currency, billing_type,
  fair_deal, published_at, early_backer_ends_at, early_backer_purchase_cap,
  purchase_count, category, problem_tags, cheer_count, maker_id,
  thumbnail_url, lemon_squeezy_url,
  maker:profiles!maker_id (
    display_name,
    total_internal_revenue_cents, total_external_revenue_cents, graduated_at
  )
` as const;
