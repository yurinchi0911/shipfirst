"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  type ProductListItem,
  earlyBackerSlotsLeft,
  formatPrice,
  isEarlyBackerActive,
  isGraduating,
  truncateDescription,
} from "@/lib/products";
import { FairDealBadge } from "@/components/badges/fair-deal-badge";
import { EarlyBackerBadge } from "@/components/badges/early-backer-badge";
import { RevenueBadge } from "@/components/badges/revenue-badge";
import { GraduatingBadge } from "@/components/badges/graduating-badge";

export function ProductCard({ product }: { product: ProductListItem }) {
  const t = useTranslations("card");
  const showEarlyBacker = isEarlyBackerActive(product);
  const makerConnected = product.maker?.stripe_onboarding_complete ?? false;
  const graduating = isGraduating(product);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col rounded-2xl border bg-card p-5 transition-all duration-150 hover:shadow-md hover:-translate-y-px"
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {product.fair_deal && <FairDealBadge />}
        {showEarlyBacker && (
          <EarlyBackerBadge slotsLeft={earlyBackerSlotsLeft(product)} />
        )}
        {makerConnected && <RevenueBadge />}
        {graduating && <GraduatingBadge />}
      </div>

      <h3 className="text-base font-semibold leading-snug group-hover:underline">
        {product.name}
      </h3>

      {product.maker?.display_name && (
        <p className="mt-1 text-xs text-muted-foreground">
          {product.maker.display_name}
        </p>
      )}

      <p className="mt-2 flex-1 text-sm text-muted-foreground">
        {truncateDescription(product.description)}
      </p>

      <div className="mt-4 flex items-baseline justify-between gap-2 border-t pt-4">
        <span className="text-lg font-bold tabular-nums">
          {formatPrice(product.price_cents, product.currency)}
        </span>
        <span className="text-xs text-muted-foreground">
          {product.billing_type === "subscription" ? t("subscription") : t("oneTime")}
        </span>
      </div>

      {product.cheer_count > 0 && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {product.cheer_count} ♥
        </p>
      )}
    </Link>
  );
}
