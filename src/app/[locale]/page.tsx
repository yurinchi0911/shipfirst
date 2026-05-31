import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight, BadgeCheck, Percent, Zap } from "lucide-react";
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
    ls_only?: string;
    q?: string;
  }>;
};

async function getProducts(params: {
  tab: DiscoveryTab;
  category?: string;
  tag?: string;
  maxPriceCents?: number;
  lsOnly?: boolean;
  query?: string;
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
  if (params.lsOnly) {
    products = products.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p) => !!(p as any).lemon_squeezy_url
    );
  }
  if (params.query) {
    const q = params.query.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.problem_tags?.some((t) => t.toLowerCase().includes(q))
    );
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
        lsOnly: sp.ls_only === "1",
        query: sp.q?.trim() || undefined,
      })
    : [];

  const tabLink = (tabId: DiscoveryTab) => {
    const p = new URLSearchParams(sp as Record<string, string>);
    p.set("tab", tabId);
    return `/${locale}?${p.toString()}#products`;
  };

  return (
    <div>
      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/50">
        {/* Background layers */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.205 0 0 / 0.07), transparent)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.015]"
          aria-hidden
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          {/* Positioning comparison */}
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <PositioningChip
              platform={t("compared1Platform")}
              value={t("compared1Value")}
              muted
            />
            <span className="text-border" aria-hidden>·</span>
            <PositioningChip
              platform={t("compared2Platform")}
              value={t("compared2Value")}
              muted
            />
            <span className="text-border" aria-hidden>·</span>
            <PositioningChip
              platform={t("compared3Platform")}
              value={t("compared3Value")}
              highlight
            />
          </div>

          {/* Headline */}
          <h1 className="max-w-xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            {t("headline")}
            <span className="block text-muted-foreground/50">{t("headlineSub")}</span>
          </h1>

          {/* Body */}
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("body")}
          </p>

          {/* Trust pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            <TrustPill icon={Zap}>{t("pillFree")}</TrustPill>
            <TrustPill icon={Percent}>{t("pillFee")}</TrustPill>
            <TrustPill icon={BadgeCheck}>{t("pillFairDeal")}</TrustPill>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/maker/products/new"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 rounded-xl")}
            >
              {t("ctaList")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="#products"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "rounded-xl"
              )}
            >
              {t("ctaBrowse")}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How it works ──────────────────────────────────────────── */}
      <section className="border-b border-border/50 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
          <h2 className="mb-10 text-center text-xl font-bold tracking-tight sm:text-2xl">
            {t("howTitle")}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {([1, 2, 3] as const).map((n) => (
              <div key={n} className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-6">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {n}
                </span>
                <h3 className="text-sm font-semibold">{t(`howStep${n}Title`)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{t(`howStep${n}Body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────────────────────── */}
      {products.length > 0 && (
        <section className="border-b border-border/50">
          <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-border/50 px-4 sm:px-6">
            {[
              { value: products.length, label: t("statProducts") },
              { value: products.reduce((s, p) => s + (p.purchase_count ?? 0), 0), label: t("statSales") },
              { value: [...new Set(products.map((p) => p.maker_id))].length, label: t("statMakers") },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center py-8 text-center">
                <span className="text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
                  {value}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Discovery ─────────────────────────────────────────────── */}
      <section
        id="products"
        className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16"
      >
        {/* Tab bar */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div
            className="flex gap-0.5 rounded-xl border bg-muted/30 p-1 text-sm"
            role="tablist"
          >
            {(["new", "popular", "graduating"] as const).map((tabId) => (
              <Link
                key={tabId}
                href={tabLink(tabId)}
                role="tab"
                aria-selected={tab === tabId}
                className={cn(
                  "rounded-lg px-4 py-1.5 font-medium transition-all duration-150",
                  tab === tabId
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(`tab${tabId.charAt(0).toUpperCase()}${tabId.slice(1)}`)}
              </Link>
            ))}
          </div>

          {products.length > 0 && (
            <p className="shrink-0 text-sm text-muted-foreground">
              {t("productsCount", { count: products.length })}
            </p>
          )}
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
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
            <p className="text-4xl">📦</p>
            <p className="mt-4 text-sm font-medium">
              {tab === "graduating" ? t("emptyGraduating") : t("empty")}
            </p>
            <Link
              href="/maker/products/new"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-4 rounded-xl"
              )}
            >
              {t("emptyCta")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PositioningChip({
  platform,
  value,
  muted,
  highlight,
}: {
  platform: string;
  value: string;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        muted &&
          "border border-border/70 bg-muted/50 text-muted-foreground",
        highlight &&
          "border border-primary/30 bg-primary/10 text-foreground"
      )}
    >
      <span className={cn("font-semibold", highlight && "text-primary")}>
        {platform}
      </span>
      <span aria-hidden className={cn("opacity-40", highlight && "opacity-60")}>
        →
      </span>
      <span>{value}</span>
    </span>
  );
}

function TrustPill({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
      <Icon className="size-3.5 shrink-0 text-primary" aria-hidden />
      {children}
    </span>
  );
}
