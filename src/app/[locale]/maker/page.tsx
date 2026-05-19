import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Plus } from "lucide-react";
import { MakerProductList } from "@/components/maker/maker-product-list";
import { StripeSetupBanner } from "@/components/maker/stripe-setup-banner";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { MakerProductItem } from "@/lib/products";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

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
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
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
    .select("email, display_name, role, stripe_onboarding_complete")
    .eq("id", user.id)
    .single();

  const { data: productsRaw } = await supabase
    .from("products")
    .select(
      "id, name, description, price_cents, currency, billing_type, fair_deal, status, published_at, purchase_count, updated_at"
    )
    .eq("maker_id", user.id)
    .in("status", ["draft", "published"])
    .order("updated_at", { ascending: false });

  const products = (productsRaw ?? []) as MakerProductItem[];
  const publishedCount = products.filter((p) => p.status === "published").length;
  const draftCount = products.filter((p) => p.status === "draft").length;
  const name = profile?.display_name || profile?.email || user.email;
  const showStripeBanner = !profile?.stripe_onboarding_complete;

  return (
    <span className="block">
      <span className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/5 via-background to-background">
        <span
          className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <span className="relative mx-auto flex max-w-5xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-12">
          <span className="space-y-2">
            <span className="text-sm font-medium text-primary">{t("title")}</span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("welcome", { name })}
            </h1>
            <p className="max-w-lg text-muted-foreground">{t("dashboardHint")}</p>
          </span>
          <Link
            href="/maker/products/new"
            className={cn(buttonVariants({ size: "lg" }), "shrink-0 gap-2")}
          >
            <Plus className="size-4" aria-hidden />
            {t("listCta")}
          </Link>
        </span>
      </span>

      <span className="mx-auto block max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        {showStripeBanner && <StripeSetupBanner />}

        <span className="grid gap-3 sm:grid-cols-3">
          <StatCard label={t("statTotal")} value={products.length} />
          <StatCard label={t("statPublished")} value={publishedCount} />
          <StatCard label={t("statDraft")} value={draftCount} />
        </span>

        <section className="space-y-4">
          <span className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">{t("productsTitle")}</h2>
          </span>
          <MakerProductList products={products} />
        </section>

        <section className="rounded-xl border bg-card/50 p-5 text-sm ring-1 ring-foreground/5">
          <h2 className="font-medium">{t("accountTitle")}</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <span>
              <dt className="text-muted-foreground">{t("email")}</dt>
              <dd className="font-medium">{profile?.email ?? user.email}</dd>
            </span>
            <span>
              <dt className="text-muted-foreground">{t("role")}</dt>
              <dd className="font-medium">{profile?.role ?? "maker"}</dd>
            </span>
            <span>
              <dt className="text-muted-foreground">{t("stripe")}</dt>
              <dd className="font-medium">
                {profile?.stripe_onboarding_complete
                  ? t("stripeDone")
                  : t("stripePending")}
              </dd>
            </span>
          </dl>
        </section>
      </span>
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-xl border bg-card px-4 py-3 ring-1 ring-foreground/5">
      <span className="block text-2xl font-bold tabular-nums">{value}</span>
      <span className="block text-sm text-muted-foreground">{label}</span>
    </span>
  );
}
