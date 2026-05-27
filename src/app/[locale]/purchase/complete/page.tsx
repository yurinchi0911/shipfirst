import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";

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
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const t = await getTranslations("purchaseComplete");
  void isSupabaseConfigured(); // keep import live

  const productName = sp.product_name?.trim() || null;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-9" aria-hidden />
      </span>

      <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
        {t("headline")}
      </h1>

      {productName ? (
        <div className="mt-6 w-full">
          <div className="rounded-2xl border bg-card p-6 text-left shadow-sm">
            <p className="text-sm text-muted-foreground">{t("sessionLabel")}</p>
            <p className="mt-1 text-lg font-semibold">{productName}</p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-muted-foreground">{t("body")}</p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={cn(buttonVariants())}>
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
