export type PurchaseStatus = "pending" | "paid" | "refunded" | "failed";

export type BuyerPurchaseItem = {
  id: string;
  amount_cents: number;
  currency: string;
  status: PurchaseStatus;
  is_early_backer: boolean;
  created_at: string;
  product: {
    id: string;
    name: string;
  } | null;
};

export function formatPurchaseDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
