import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  earlyBackerSlotsLeft,
  formatPrice,
  isEarlyBackerActive,
  type ProductDetail,
} from "@/lib/products";
import { FairDealBadge } from "@/components/badges/fair-deal-badge";
import { EarlyBackerBadge } from "@/components/badges/early-backer-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function getProduct(id: string): Promise<ProductDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, description, price_cents, currency, billing_type, fair_deal, published_at, early_backer_ends_at, early_backer_purchase_cap, purchase_count, cancel_url, refund_policy, trial_days, trial_terms, delivery_url"
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return data as ProductDetail;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) return { title: "Product" };
  const product = await getProduct(id);
  return { title: product?.name ?? "Product" };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  if (!isSupabaseConfigured()) notFound();

  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const t = await getTranslations("product");
  const tCard = await getTranslations("card");
  const showEarlyBacker = isEarlyBackerActive(product);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6")}
      >
        {t("back")}
      </Link>

      <div className="mb-4 flex flex-wrap gap-2">
        {product.fair_deal && <FairDealBadge />}
        {showEarlyBacker && (
          <EarlyBackerBadge slotsLeft={earlyBackerSlotsLeft(product)} />
        )}
      </div>

      <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-bold">
          {formatPrice(product.price_cents, product.currency)}
        </span>
        <span className="text-sm text-muted-foreground">
          {product.billing_type === "subscription"
            ? tCard("subscription")
            : tCard("oneTime")}
        </span>
        {product.trial_days > 0 && (
          <span className="text-sm text-muted-foreground">
            · {t("trialDays", { days: product.trial_days })}
          </span>
        )}
      </div>

      <div className="mt-8 max-w-none">
        <p className="whitespace-pre-wrap text-foreground">{product.description}</p>
      </div>

      <section className="mt-10 space-y-4 rounded-xl border bg-muted/20 p-6 text-sm">
        <h2 className="font-semibold">{t("beforeBuy")}</h2>
        <div>
          <dt className="text-muted-foreground">{t("cancelUrl")}</dt>
          <dd className="mt-1">
            <a
              href={product.cancel_url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-primary underline-offset-4 hover:underline"
            >
              {product.cancel_url}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("refundPolicy")}</dt>
          <dd className="mt-1 whitespace-pre-wrap">{product.refund_policy}</dd>
        </div>
        {product.trial_days > 0 && product.trial_terms && (
          <div>
            <dt className="text-muted-foreground">{t("trialTerms")}</dt>
            <dd className="mt-1 whitespace-pre-wrap">{product.trial_terms}</dd>
          </div>
        )}
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button disabled className="sm:flex-1">
          {t("buySoon")}
        </Button>
        <Link
          href="/maker/products/new"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "sm:flex-1 text-center"
          )}
        >
          {t("listYours")}
        </Link>
      </div>
    </div>
  );
}
