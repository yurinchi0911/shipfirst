import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GRADUATION_THRESHOLD_CENTS,
  GRADUATING_THRESHOLD_CENTS,
  formatPrice,
} from "@/lib/products";

type MakerRow = {
  id: string;
  display_name: string | null;
  bio: string | null;
  total_internal_revenue_cents: number;
  total_external_revenue_cents: number;
  graduated_at: string | null;
  product_count: number;
};

async function getRankedMakers(): Promise<MakerRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      bio,
      total_internal_revenue_cents,
      total_external_revenue_cents,
      graduated_at
    `)
    .eq("role", "maker")
    .order("total_internal_revenue_cents", { ascending: false })
    .limit(50);

  if (!data) return [];

  // 各メーカーの公開商品数を取得
  const ids = data.map((m) => m.id);
  const { data: counts } = await supabase
    .from("products")
    .select("maker_id")
    .eq("status", "published")
    .in("maker_id", ids);

  const countMap: Record<string, number> = {};
  for (const row of counts ?? []) {
    countMap[row.maker_id] = (countMap[row.maker_id] ?? 0) + 1;
  }

  return data
    .map((m) => ({
      ...m,
      bio: m.bio ?? null,
      product_count: countMap[m.id] ?? 0,
    }))
    .sort((a, b) => {
      const totalA = a.total_internal_revenue_cents + a.total_external_revenue_cents;
      const totalB = b.total_internal_revenue_cents + b.total_external_revenue_cents;
      return totalB - totalA;
    });
}

function RevenueBar({ totalCents }: { totalCents: number }) {
  const pct = Math.min(100, (totalCents / GRADUATION_THRESHOLD_CENTS) * 100);
  const isWarning = totalCents >= GRADUATING_THRESHOLD_CENTS;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isWarning ? "bg-orange-400" : "bg-primary/60"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {formatPrice(totalCents)} / $1,000
      </span>
    </div>
  );
}

export default async function MakersRankingPage() {
  const t = await getTranslations("makers");
  const makers = await getRankedMakers();
  const active = makers.filter((m) => !m.graduated_at);
  const graduated = makers.filter((m) => m.graduated_at);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">{t("rankingTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("rankingSubtitle")}</p>
      </div>

      {/* Active makers */}
      {active.length === 0 && (
        <p className="rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          {t("rankingEmpty")}
        </p>
      )}

      <ol className="space-y-3">
        {active.map((maker, i) => {
          const total =
            maker.total_internal_revenue_cents + maker.total_external_revenue_cents;
          const isTop3 = i < 3;
          const medal = ["🥇", "🥈", "🥉"][i] ?? null;
          return (
            <li key={maker.id}>
              <Link
                href={`/makers/${maker.id}`}
                className="group flex items-start gap-4 rounded-2xl border border-border/80 bg-card p-5 transition-all duration-200 hover:border-border hover:shadow-md hover:shadow-black/[0.05] hover:-translate-y-0.5"
              >
                {/* Rank */}
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                    isTop3
                      ? "bg-primary/10 text-primary"
                      : "bg-muted/60 text-muted-foreground"
                  )}
                >
                  {medal ?? `#${i + 1}`}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold group-hover:text-primary transition-colors">
                      {maker.display_name ?? t("anonymous")}
                    </span>
                    {maker.product_count > 0 && (
                      <span className="rounded-full bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                        {t("productCount", { count: maker.product_count })}
                      </span>
                    )}
                  </div>
                  {maker.bio && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {maker.bio}
                    </p>
                  )}
                  <RevenueBar totalCents={total} />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* Graduated section */}
      {graduated.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <span aria-hidden>🎓</span>
            {t("rankingGraduated")}
          </h2>
          <ul className="space-y-2">
            {graduated.map((maker) => (
              <li key={maker.id}>
                <Link
                  href={`/makers/${maker.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
                >
                  <span>🎓</span>
                  <span>{maker.display_name ?? t("anonymous")}</span>
                  <span className="ml-auto text-xs opacity-60">
                    {t("rankingGraduatedLabel")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 rounded-2xl border border-dashed bg-muted/20 px-6 py-8 text-center">
        <p className="text-sm font-medium">{t("rankingCtaTitle")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("rankingCtaBody")}</p>
        <Link
          href="/maker/products/new"
          className={cn(buttonVariants({ size: "sm" }), "mt-4 rounded-xl")}
        >
          {t("rankingCta")}
        </Link>
      </div>
    </div>
  );
}
