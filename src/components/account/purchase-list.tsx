import { Package } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EarlyBackerBadge } from "@/components/badges/early-backer-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  type BuyerPurchaseItem,
  formatPurchaseDate,
} from "@/lib/purchases";
import { formatPrice } from "@/lib/products";
import { cn } from "@/lib/utils";

function StatusBadge({
  status,
  label,
}: {
  status: BuyerPurchaseItem["status"];
  label: string;
}) {
  const styles: Record<BuyerPurchaseItem["status"], string> = {
    paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    pending:
      "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    refunded: "border-border bg-muted text-muted-foreground",
    failed: "border-destructive/30 bg-destructive/10 text-destructive",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        styles[status]
      )}
    >
      {label}
    </span>
  );
}

export async function PurchaseList({
  purchases,
}: {
  purchases: BuyerPurchaseItem[];
}) {
  const t = await getTranslations("account");
  const locale = await getLocale();

  if (purchases.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
        <Package
          className="mx-auto size-10 text-muted-foreground/60"
          aria-hidden
        />
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}>
          {t("browseProducts")}
        </Link>
      </section>
    );
  }

  return (
    <ul className="space-y-3">
      {purchases.map((purchase) => {
        const productName = purchase.product?.name ?? t("unknownProduct");
        const productId = purchase.product?.id;

        return (
          <li
            key={purchase.id}
            className="flex flex-col gap-3 rounded-xl border bg-card p-4 ring-foreground/5 transition-shadow hover:shadow-sm hover:ring-1 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <span className="min-w-0 space-y-2">
              <span className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={purchase.status}
                  label={t(`status.${purchase.status}`)}
                />
                {purchase.is_early_backer && <EarlyBackerBadge />}
              </span>
              {productId ? (
                <Link
                  href={`/products/${productId}`}
                  className="block font-semibold hover:underline"
                >
                  {productName}
                </Link>
              ) : (
                <span className="block font-semibold">{productName}</span>
              )}
              <span className="block text-sm text-muted-foreground">
                {formatPurchaseDate(purchase.created_at, locale)}
              </span>
            </span>
            <span className="text-lg font-bold tabular-nums">
              {formatPrice(purchase.amount_cents, purchase.currency)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
