import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ShoppingBag } from "lucide-react";
import { PurchaseList } from "@/components/account/purchase-list";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { BuyerPurchaseItem } from "@/lib/purchases";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("title") };
}

export default async function PurchasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as Locale;
  const t = await getTranslations("account");

  if (!isSupabaseConfigured()) {
    redirect(`/${loc}/login?error=setup`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${loc}/login?next=${encodeURIComponent("/account/purchases")}`);
  }

  const { data: purchasesRaw } = await supabase
    .from("purchases")
    .select(
      `
      id,
      amount_cents,
      currency,
      status,
      is_early_backer,
      created_at,
      products (
        id,
        name
      )
    `
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const purchases: BuyerPurchaseItem[] = (purchasesRaw ?? []).map((row) => {
    const product = row.products;
    const normalized =
      product && !Array.isArray(product)
        ? product
        : Array.isArray(product)
          ? product[0]
          : null;

    return {
      id: row.id,
      amount_cents: row.amount_cents,
      currency: row.currency,
      status: row.status,
      is_early_backer: row.is_early_backer,
      created_at: row.created_at,
      product: normalized
        ? { id: normalized.id, name: normalized.name }
        : null,
    };
  });

  return (
    <span className="block">
      <span className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/5 via-background to-background">
        <span
          className="pointer-events-none absolute -left-16 top-0 size-56 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <span className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
          <span className="flex items-center gap-3 text-primary">
            <ShoppingBag className="size-6" aria-hidden />
            <span className="text-sm font-medium">{t("eyebrow")}</span>
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">{t("subtitle")}</p>
        </span>
      </span>

      <span className="mx-auto block max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <span className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {t("week2Hint")}
        </span>

        <PurchaseList purchases={purchases} />

        <span className="flex flex-wrap gap-3 pt-2">
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            {t("backHome")}
          </Link>
          <Link href="/maker" className={cn(buttonVariants({ variant: "ghost" }))}>
            {t("makerDashboard")}
          </Link>
        </span>
      </span>
    </span>
  );
}
