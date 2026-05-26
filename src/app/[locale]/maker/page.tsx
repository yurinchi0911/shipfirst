import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Plus, UserCircle } from "lucide-react";
import { MakerProductList } from "@/components/maker/maker-product-list";
import { StripeSetupBanner } from "@/components/maker/stripe-setup-banner";
import { RevenueCard } from "@/components/maker/revenue-card";
import { GraduationBanner } from "@/components/maker/graduation-banner";
import { MakerPostForm } from "@/components/maker/maker-post-form";
import { createClient } from "@/lib/supabase/server";
import { isStripeConfigured, isSupabaseConfigured } from "@/lib/env";
import { syncProfileOnboardingByAccountId } from "@/lib/stripe/connect";
import { graduationProgress } from "@/lib/graduation";
import { GRADUATING_THRESHOLD_CENTS } from "@/lib/products";
import type { MakerProductItem } from "@/lib/products";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";
import type { MakerPost } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "maker" });
  return { title: t("title") };
}

export default async function MakerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ stripe?: string }>;
}) {
  const { locale } = await params;
  const { stripe: stripeQuery } = await searchParams;
  const loc = locale as Locale;
  const t = await getTranslations("maker");

  if (!isSupabaseConfigured()) {
    redirect(`/${loc}/login?error=setup`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${loc}/login?next=${encodeURIComponent("/maker")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "email, display_name, role, stripe_account_id, stripe_onboarding_complete, total_internal_revenue_cents, total_external_revenue_cents, graduated_at"
    )
    .eq("id", user.id)
    .single();

  let stripeOnboardingComplete = profile?.stripe_onboarding_complete ?? false;

  if (isStripeConfigured() && profile?.stripe_account_id && !stripeOnboardingComplete) {
    try {
      stripeOnboardingComplete = await syncProfileOnboardingByAccountId(
        profile.stripe_account_id
      );
    } catch {
      // Stripe / admin 未設定時は表示のみ継続
    }
  }

  const { data: productsRaw } = await supabase
    .from("products")
    .select(
      "id, name, description, price_cents, currency, billing_type, fair_deal, status, published_at, purchase_count, updated_at"
    )
    .eq("maker_id", user.id)
    .in("status", ["draft", "published"])
    .order("updated_at", { ascending: false });

  const { data: postsRaw } = await supabase
    .from("maker_posts")
    .select("id, maker_id, product_id, body, created_at")
    .eq("maker_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const products = (productsRaw ?? []) as MakerProductItem[];
  const posts = (postsRaw ?? []) as MakerPost[];
  const publishedCount = products.filter((p) => p.status === "published").length;
  const draftCount = products.filter((p) => p.status === "draft").length;
  const totalSales = products.reduce((sum, p) => sum + (p.purchase_count ?? 0), 0);
  const name = profile?.display_name || profile?.email || user.email;
  const showStripeBanner = !stripeOnboardingComplete;
  const showStripeReturnNotice = stripeQuery === "return" || stripeQuery === "refresh";

  const internalCents = profile?.total_internal_revenue_cents ?? 0;
  const externalCents = profile?.total_external_revenue_cents ?? 0;
  const { percent, graduated } = graduationProgress(internalCents, externalCents);
  const showGraduationBanner =
    graduated || internalCents + externalCents >= GRADUATING_THRESHOLD_CENTS;

  const showFirstSaleCelebration = totalSales >= 1 && internalCents > 0 && !graduated;

  return (
    <div>
      {/* Hero / Header */}
      <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/5 via-background to-background">
        <div
          className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-12">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">{t("title")}</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("welcome", { name })}
            </h1>
            <p className="max-w-lg text-muted-foreground">{t("dashboardHint")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/account/profile"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
            >
              <UserCircle className="size-4" aria-hidden />
              {t("editProfile")}
            </Link>
            {!graduated && (
              <Link
                href="/maker/products/new"
                className={cn(buttonVariants({ size: "sm" }), "gap-2")}
              >
                <Plus className="size-4" aria-hidden />
                {t("listCta")}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        {/* Stripe return notice */}
        {showStripeReturnNotice && stripeOnboardingComplete && (
          <p
            role="status"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100"
          >
            {t("stripeReturnSuccess")}
          </p>
        )}
        {showStripeReturnNotice && !stripeOnboardingComplete && (
          <p
            role="status"
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm"
          >
            {t("stripeReturnPending")}
          </p>
        )}

        {/* First Sale 祝福カード */}
        {showFirstSaleCelebration && (
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-6 dark:from-emerald-950/20 dark:to-teal-950/10">
            <div
              className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-emerald-400/20 blur-2xl"
              aria-hidden
            />
            <p className="text-2xl">🎉</p>
            <h2 className="mt-2 text-lg font-bold tracking-tight">
              {t("firstSaleTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("firstSaleBody")}</p>
          </div>
        )}

        {/* Graduation banner (near or at $1000) */}
        {showGraduationBanner && (
          <GraduationBanner
            internalCents={internalCents}
            externalCents={externalCents}
            graduated={graduated}
          />
        )}

        {/* Stripe setup */}
        {showStripeBanner && !graduated && <StripeSetupBanner />}

        {/* Stats grid */}
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard label={t("statTotal")} value={products.length} />
          <StatCard label={t("statPublished")} value={publishedCount} />
          <StatCard label={t("statDraft")} value={draftCount} />
          <StatCard
            label={t("statRevenue")}
            value={`$${((internalCents + externalCents) / 100).toFixed(0)}`}
            progress={percent}
          />
        </div>

        {/* Revenue card */}
        <RevenueCard internalCents={internalCents} externalCents={externalCents} />

        {/* Products */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">{t("productsTitle")}</h2>
          </div>
          <MakerProductList products={products} />
        </section>

        {/* Maker posts */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{t("postTitle")}</h2>
          <MakerPostForm />
          {posts.length > 0 ? (
            <ul className="space-y-3">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="rounded-xl border bg-card/50 p-4 text-sm"
                >
                  <p className="whitespace-pre-wrap">{post.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("postEmpty")}</p>
          )}
        </section>

        {/* Account info */}
        <section className="rounded-xl border bg-card/50 p-5 text-sm ring-1 ring-foreground/5">
          <h2 className="font-medium">{t("accountTitle")}</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">{t("email")}</dt>
              <dd className="font-medium">{profile?.email ?? user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("role")}</dt>
              <dd className="font-medium">{profile?.role ?? "maker"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("stripe")}</dt>
              <dd className="font-medium">
                {stripeOnboardingComplete ? t("stripeDone") : t("stripePending")}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  progress,
}: {
  label: string;
  value: number | string;
  progress?: number;
}) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 ring-1 ring-foreground/5">
      <span className="block text-2xl font-bold tabular-nums">{value}</span>
      <span className="block text-sm text-muted-foreground">{label}</span>
      {progress !== undefined && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );
}
