import { Pencil, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FairDealBadge } from "@/components/badges/fair-deal-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  type MakerProductItem,
  formatPrice,
  truncateDescription,
} from "@/lib/products";
import { cn } from "@/lib/utils";

function StatusBadge({
  status,
  label,
}: {
  status: MakerProductItem["status"];
  label: string;
}) {
  const styles =
    status === "published"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        styles
      )}
    >
      {label}
    </span>
  );
}

export async function MakerProductList({
  products,
}: {
  products: MakerProductItem[];
}) {
  const t = await getTranslations("maker");
  const tCard = await getTranslations("card");

  if (products.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
        <p className="text-sm text-muted-foreground">{t("productsEmpty")}</p>
        <Link href="/maker/products/new" className={cn(buttonVariants(), "mt-4 inline-flex")}>
          {t("listCta")}
        </Link>
      </section>
    );
  }

  return (
    <ul className="space-y-3">
      {products.map((product) => (
        <li
          key={product.id}
          className="flex flex-col gap-4 rounded-xl border bg-card p-4 ring-foreground/5 transition-shadow hover:shadow-sm hover:ring-1 sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <span className="min-w-0 flex-1 space-y-2">
            <span className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={product.status}
                label={
                  product.status === "published"
                    ? t("statusPublished")
                    : t("statusDraft")
                }
              />
              {product.fair_deal && product.status === "published" && (
                <FairDealBadge />
              )}
            </span>
            <span className="block font-semibold">{product.name}</span>
            <span className="block text-sm text-muted-foreground">
              {truncateDescription(product.description, 100)}
            </span>
            <span className="flex flex-wrap items-baseline gap-2 text-sm">
              <span className="font-bold">
                {formatPrice(product.price_cents, product.currency)}
              </span>
              <span className="text-muted-foreground">
                {product.billing_type === "subscription"
                  ? tCard("subscription")
                  : tCard("oneTime")}
              </span>
              {product.status === "published" && (
                <span className="text-muted-foreground">
                  · {t("salesCount", { count: product.purchase_count })}
                </span>
              )}
            </span>
          </span>

          <span className="flex shrink-0 flex-wrap gap-2">
            {product.status === "published" && (
              <Link
                href={`/products/${product.id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-1.5"
                )}
              >
                <ExternalLink className="size-3.5" aria-hidden />
                {t("viewPublic")}
              </Link>
            )}
            <Link
              href={`/maker/products/${product.id}/edit`}
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
            >
              <Pencil className="size-3.5" aria-hidden />
              {t("editProduct")}
            </Link>
          </span>
        </li>
      ))}
    </ul>
  );
}
