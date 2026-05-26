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
      className="group flex flex-col rounded-2xl border border-border/80 bg-card p-5 transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-black/[0.06] hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
    >
      {/* Badges */}
      {(product.fair_deal || showEarlyBacker || makerConnected || graduating) && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {product.fair_deal && <FairDealBadge />}
          {showEarlyBacker && <EarlyBackerBadge slotsLeft={earlyBackerSlotsLeft(product)} />}
          {makerConnected && <RevenueBadge />}
          {graduating && <GraduatingBadge />}
        </div>
      )}

      {/* Title */}
      <h3 className="text-[0.95rem] font-semibold leading-snug tracking-tight group-hover:text-primary transition-colors">
        {product.name}
      </h3>

      {/* Maker */}
      {product.maker?.display_name && (
        <p className="mt-1 text-xs text-muted-foreground/70">
          {product.maker.display_name}
        </p>
      )}

      {/* Description */}
      <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">
        {truncateDescription(product.description)}
      </p>

      {/* Footer */}
      <div className="mt-5 flex items-baseline justify-between gap-2 border-t border-border/60 pt-4">
        <span className="text-lg font-bold tabular-nums tracking-tight">
          {formatPrice(product.price_cents, product.currency)}
        </span>
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <span>
            {product.billing_type === "subscription" ? t("subscription") : t("oneTime")}
          </span>
          {product.cheer_count > 0 && (
            <>
              <span aria-hidden className="opacity-40">·</span>
              <span>{product.cheer_count} ♥</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
