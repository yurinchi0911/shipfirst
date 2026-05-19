"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  type ProductListItem,
  earlyBackerSlotsLeft,
  formatPrice,
  isEarlyBackerActive,
  truncateDescription,
} from "@/lib/products";
import { FairDealBadge } from "@/components/badges/fair-deal-badge";
import { EarlyBackerBadge } from "@/components/badges/early-backer-badge";

export function ProductCard({ product }: { product: ProductListItem }) {
  const t = useTranslations("card");
  const showEarlyBacker = isEarlyBackerActive(product);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col rounded-xl border bg-card p-5 ring-foreground/10 transition-shadow hover:shadow-md hover:ring-1"
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {product.fair_deal && <FairDealBadge />}
        {showEarlyBacker && (
          <EarlyBackerBadge slotsLeft={earlyBackerSlotsLeft(product)} />
        )}
      </div>
      <h3 className="text-lg font-semibold group-hover:underline">{product.name}</h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">
        {truncateDescription(product.description)}
      </p>
      <div className="mt-4 flex items-baseline justify-between gap-2 border-t pt-4">
        <span className="text-lg font-bold">
          {formatPrice(product.price_cents, product.currency)}
        </span>
        <span className="text-xs text-muted-foreground">
          {product.billing_type === "subscription"
            ? t("subscription")
            : t("oneTime")}
        </span>
      </div>
    </Link>
  );
}
