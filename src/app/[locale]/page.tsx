import { Suspense, type ComponentType } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BadgeCheck, Percent, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { ProductDiscoveryFilters } from "@/components/product-discovery-filters";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  type ProductListItem,
  type DiscoveryTab,
  isGraduating,
  PRODUCT_LIST_SELECT,
} from "@/lib/products";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    tab?: string;
    category?: string;
    tag?: string;
    max_price?: string;
    stripe_only?: string;
  }>;
};

async function getProducts(params: {
  tab: DiscoveryTab;
  category?: string;
  tag?: string;
  maxPriceCents?: number;
  stripeOnly?: boolean;
}): Promise<ProductListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_LIST_SELECT)
    .eq("status", "published");

  if (error || !data) return [];

  let products = (data as unknown as ProductListItem[]).filter(
    (p) => !p.maker?.graduated_at
  );

  if (params.category) {
    products = products.filter((p) => p.category === params.category);
  }
  if (params.tag) {
    products = products.filter((p) => p.problem_tags?.includes(params.tag!));
  }
  if (params.maxPriceCents) {
    products = products.filter((p) => p.price_cents <= params.maxPriceCents!);
  }
  if (params.stripeOnly) {
    products = products.filter((p) => p.maker?.stripe_onboarding_complete);
  }

  switch (params.tab) {
    case "popular":
      products.sort(
        (a, b) =>
          b.cheer_count + b.purchase_count - (a.cheer_count + a.purchase_count)
      );
      break;
    case "graduating":
      products = products.filter((p) => isGraduating(p));
      products.sort((a, b) => {
        const aRev =
          (a.maker?.total_internal_revenue_cents ?? 0) +
          (a.maker?.total_external_revenue_cents ?? 0);
        const bRev =
          (b.maker?.total_internal_revenue_cents ?? 0) +
          (b.maker?.total_external_revenue_cents ?? 0);
        return bRev - aRev;
      });
      break;
    default:
      products.sort((a, b) => {
        const aDate = a.published_at ? new Date(a.published_at).getTime() : 0;
        const bDate = b.published_at ? new Date(b.published_at).getTime() : 0;
        return bDate - aDate;
      });
  }

  return products;
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

export default async function HomePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  const tab: DiscoveryTab =
    sp.tab === "popular" || sp.tab === "graduating" ? sp.tab : "new";
  const maxPriceCents = sp.max_price
    ? Math.round(parseFloat(sp.max_price) * 100)
    : undefined;

  const t = await getTranslations("home");
  const products = isSupabaseConfigured()
    ? await getProducts({
        tab,
        category: sp.category,
        tag: sp.tag,
        maxPriceCents,
        stripeOnly: sp.stripe_only === "1",
      })
    : [];

  const tabLink = (t: DiscoveryTab) => {
    const p = new URLSearchParams(sp as Record<string, string>);
    p.set("tab", t);
    return `/${locale}?${p.toString()}#products`;
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <span
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--primary)/0.1,transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            {t("tagline")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t("taglineSub")}</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            {t("headline")}
            <span className="mt-1 block text-muted-foreground">{t("headlineSub")}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground">{t("body")}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <TrustPill icon={Sparkles}>{t("pillFree")}</TrustPill>
            <TrustPill icon={Percent}>{t("pillFee")}</TrustPill>
            <TrustPill icon={BadgeCheck}>{t("pillFairDeal")}</TrustPill>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/maker/products/new" className={cn(buttonVariants({ size: "lg" }))}>
              {t("ctaList")}
            </Link>
            <Link
              href="#products"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              {t("ctaBrowse")}
            </Link>
          </div>
        </div>
      </section>

      {/* Discovery */}
      <section
        id="products"
        className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16"
      >
        {/* Tabs */}
        <div
          className="mb-6 flex gap-1 rounded-xl border bg-muted/40 p-1 text-sm w-fit"
          role="tablist"
        >
          {(["new", "popular", "graduating"] as const).map((t_) => (
            <Link
              key={t_}
              href={tabLink(t_)}
              role="tab"
              aria-selected={tab === t_}
              className={cn(
                "rounded-lg px-4 py-1.5 font-medium transition-colors",
                tab === t_
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`tab${t_.charAt(0).toUpperCase()}${t_.slice(1)}`)}
            </Link>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-8">
          <Suspense fallback={null}>
            <ProductDiscoveryFilters />
          </Suspense>
        </div>

        {!isSupabaseConfigured() && (
          <p className="mb-6 text-sm text-muted-foreground">{t("supabaseHint")}</p>
        )}

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/25 p-12 text-center text-sm text-muted-foreground">
            {tab === "graduating" ? t("emptyGraduating") : t("empty")}
            <br />
            <Link
              href="/maker/products/new"
              className="mt-2 inline-block font-medium underline"
            >
              {t("emptyCta")}
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {t("productsCount", { count: products.length })}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
