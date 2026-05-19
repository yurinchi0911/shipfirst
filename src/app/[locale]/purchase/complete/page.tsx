import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  return (
    <span className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-9" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
        {t("headline")}
      </h1>
      <p className="mt-3 text-muted-foreground">{t("body")}</p>
      <p className="mt-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        {t("week2Note")}
      </p>
      {sessionId && (
        <p className="mt-4 max-w-full truncate font-mono text-xs text-muted-foreground">
          {t("sessionLabel")}: {sessionId}
        </p>
      )}
      <span className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/account/purchases" className={cn(buttonVariants())}>
          {t("viewPurchases")}
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          {t("backHome")}
        </Link>
      </span>
    </span>
  );
}
