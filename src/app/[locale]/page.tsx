import type { ComponentType } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BadgeCheck, Percent, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ProductListItem } from "@/lib/products";

async function getPublishedProducts(): Promise<ProductListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, description, price_cents, currency, billing_type, fair_deal, published_at, early_backer_ends_at, early_backer_purchase_cap, purchase_count"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as ProductListItem[];
}

function TrustPill({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
      <Icon className="size-3.5 shrink-0 text-primary" aria-hidden />
      {children}
    </span>
  );
}

export default async function HomePage() {
  const t = await getTranslations("home");
  const products = isSupabaseConfigured() ? await getPublishedProducts() : [];

  return (
    <span className="block">
      <section className="relative overflow-hidden border-b border-border/60">
        <span
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--primary)/0.12,transparent)]"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -right-24 top-10 size-72 rounded-full bg-primary/8 blur-3xl"
          aria-hidden
        />
        <span className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-medium text-primary">{t("tagline")}</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            {t("headline")}
            <span className="mt-1 block text-muted-foreground">{t("headlineSub")}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t("body")}</p>

          <span className="mt-6 flex flex-wrap gap-2">
            <TrustPill icon={Sparkles}>{t("pillFree")}</TrustPill>
            <TrustPill icon={Percent}>{t("pillFee")}</TrustPill>
            <TrustPill icon={BadgeCheck}>{t("pillFairDeal")}</TrustPill>
          </span>

          <span className="mt-8 flex flex-wrap gap-3">
            <Link href="/maker/products/new" className={cn(buttonVariants({ size: "lg" }))}>
              {t("ctaList")}
            </Link>
            <Link
              href="/#products"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              {t("ctaBrowse")}
            </Link>
          </span>
        </span>
      </section>

      <section
        id="products"
        className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16"
      >
        <span className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-semibold">{t("productsTitle")}</h2>
          {products.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {t("productsCount", { count: products.length })}
            </span>
          )}
        </span>

        {!isSupabaseConfigured() && (
          <p className="mb-6 text-sm text-muted-foreground">{t("supabaseHint")}</p>
        )}

        {products.length === 0 ? (
          <span className="block rounded-2xl border border-dashed border-border bg-muted/25 p-12 text-center text-sm text-muted-foreground">
            {t("empty")}
            <br />
            <Link href="/maker/products/new" className="mt-2 inline-block font-medium underline">
              {t("emptyCta")}
            </Link>
          </span>
        ) : (
          <span className="grid gap-4 sm:grid-cols-2">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </span>
        )}
      </section>
    </span>
  );
}
