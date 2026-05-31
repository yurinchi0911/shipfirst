import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isJa = locale === "ja";
  return {
    title: isJa
      ? "LemonSqueezy セットアップガイド | ShipFirst"
      : "LemonSqueezy Setup Guide | ShipFirst",
    description: isJa
      ? "ShipFirstでプロダクトを販売するために必要なLemonSqueezyの設定手順をステップごとに解説します。"
      : "Step-by-step guide to set up LemonSqueezy and start selling on ShipFirst.",
  };
}

type Step = {
  number: string;
  emoji: string;
  titleKey: string;
  bodyKey: string;
  cta?: { labelKey: string; href: string };
  importantKey?: string;
  tipKey?: string;
};

const STEPS: Step[] = [
  {
    number: "01",
    emoji: "🍋",
    titleKey: "step1Title",
    bodyKey: "step1Body",
    cta: { labelKey: "step1Cta", href: "https://app.lemonsqueezy.com" },
  },
  {
    number: "02",
    emoji: "📦",
    titleKey: "step2Title",
    bodyKey: "step2Body",
    cta: { labelKey: "step2Cta", href: "https://app.lemonsqueezy.com/products" },
  },
  {
    number: "03",
    emoji: "🤝",
    titleKey: "step3Title",
    bodyKey: "step3Body",
    cta: { labelKey: "step3Cta", href: "https://app.lemonsqueezy.com/affiliates" },
    importantKey: "step3Important",
  },
  {
    number: "04",
    emoji: "🔗",
    titleKey: "step4Title",
    bodyKey: "step4Body",
    tipKey: "step4Tip",
  },
  {
    number: "05",
    emoji: "🚀",
    titleKey: "step5Title",
    bodyKey: "step5Body",
    cta: { labelKey: "step5Cta", href: "/maker/products/new" },
  },
];

export default async function LsSetupPage() {
  const t = await getTranslations("setup");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/maker"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-8 -ml-2")}
      >
        ← {t("back")}
      </Link>

      {/* Header */}
      <div className="mb-12 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🍋</span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
        </div>
        <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
        <div className="flex flex-wrap gap-3 pt-1">
          {([t("pill1"), t("pill2"), t("pill3")] as string[]).map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              ✓ {pill}
            </span>
          ))}
        </div>
      </div>

      {/* Steps */}
      <ol className="relative space-y-0">
        {STEPS.map((step, i) => (
          <li key={step.number} className="relative flex gap-6 pb-10 last:pb-0">
            {i < STEPS.length - 1 && (
              <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border" />
            )}
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/5 text-sm font-bold text-primary">
              {step.number}
            </div>
            <div className="flex-1 pt-1.5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{step.emoji}</span>
                <h2 className="text-lg font-semibold">{t(step.titleKey as Parameters<typeof t>[0])}</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(step.bodyKey as Parameters<typeof t>[0])}
              </p>
              {step.importantKey && (
                <div className="rounded-lg border border-amber-400/40 bg-amber-50/60 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
                  ⚠️ <strong>{t("important")}:</strong>{" "}
                  {t(step.importantKey as Parameters<typeof t>[0])}
                </div>
              )}
              {step.tipKey && (
                <div className="rounded-lg border border-blue-400/30 bg-blue-50/50 px-4 py-3 text-sm text-blue-800 dark:border-blue-700/40 dark:bg-blue-900/20 dark:text-blue-300">
                  💡 {t(step.tipKey as Parameters<typeof t>[0])}
                </div>
              )}
              {step.cta && (
                <a
                  href={step.cta.href}
                  target={step.cta.href.startsWith("http") ? "_blank" : undefined}
                  rel={step.cta.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2 w-fit")}
                >
                  {t(step.cta.labelKey as Parameters<typeof t>[0])}
                  {step.cta.href.startsWith("http") && (
                    <span className="text-xs opacity-50">↗</span>
                  )}
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* FAQ */}
      <section className="mt-16 space-y-6">
        <h2 className="text-xl font-bold">{t("faqTitle")}</h2>
        {([1, 2, 3, 4] as const).map((n) => (
          <details
            key={n}
            className="group rounded-xl border bg-card p-5 open:shadow-sm"
          >
            <summary className="cursor-pointer list-none text-sm font-medium">
              <span className="flex items-center justify-between gap-4">
                {t(`faq${n}Q` as Parameters<typeof t>[0])}
                <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180">
                  ▾
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t(`faq${n}A` as Parameters<typeof t>[0])}
            </p>
          </details>
        ))}
      </section>

      {/* CTA */}
      <div className="mt-14 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center space-y-4">
        <p className="text-2xl">🚀</p>
        <h2 className="text-xl font-bold">{t("ctaTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("ctaBody")}</p>
        <Link
          href="/maker/products/new"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          {t("ctaButton")}
        </Link>
      </div>
    </div>
  );
}
