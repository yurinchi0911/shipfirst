import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/products";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "purchaseComplete" });
  return { title: t("title") };
}

export default async function PurchaseCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sp = await searchParams;
  const t = await getTranslations("purchaseComplete");
  const sessionId = sp.session_id?.trim();

  type PurchaseDetails = {
    amount_cents: number;
    currency: string;
    is_early_backer: boolean;
    product: { name: string; delivery_url: string | null } | null;
  };

  let details: PurchaseDetails | null = null;

  if (isSupabaseConfigured() && sessionId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("purchases")
        .select(
          "amount_cents, currency, is_early_backer, product:products!product_id(name, delivery_url)"
        )
        .eq("stripe_checkout_session_id", sessionId)
        .eq("buyer_id", user.id)
        .eq("status", "paid")
        .maybeSingle();

      if (data) {
        details = {
          amount_cents: data.amount_cents,
          currency: data.currency,
          is_early_backer: data.is_early_backer ?? false,
          product: Array.isArray(data.product) ? data.product[0] : (data.product as PurchaseDetails["product"]),
        };
      }
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-9" aria-hidden />
      </span>

      <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
        {t("headline")}
      </h1>

      {details ? (
        <div className="mt-6 w-full space-y-4">
          <div className="rounded-2xl border bg-card p-6 text-left shadow-sm">
            <p className="text-lg font-semibold">{details.product?.name}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatPrice(details.amount_cents, details.currency)}
            </p>
            {details.is_early_backer && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-700 dark:text-orange-400">
                🌟 Early Backer
              </span>
            )}
            {details.product?.delivery_url && (
              <a
                href={details.product.delivery_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <ExternalLink className="size-4 shrink-0" aria-hidden />
                {t("deliveryLabel")}
              </a>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-muted-foreground">{t("body")}</p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/account/purchases" className={cn(buttonVariants())}>
          {t("viewPurchases")}
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
