import { CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { StripeConnectButton } from "@/components/maker/stripe-connect-button";
import { cn } from "@/lib/utils";
import { isStripeConfigured } from "@/lib/env";

export async function StripeSetupBanner({ className }: { className?: string }) {
  const t = await getTranslations("maker");
  const stripeReady = isStripeConfigured();

  return (
    <section
      role="status"
      className={cn(
        "flex gap-4 rounded-xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5",
        className
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
        <CreditCard className="size-5" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="font-medium text-foreground">{t("stripeBannerTitle")}</span>
        <span className="text-sm text-muted-foreground">{t("stripeBannerBody")}</span>
        {stripeReady ? (
          <StripeConnectButton />
        ) : (
          <span className="text-xs font-medium text-amber-800/80 dark:text-amber-300/80">
            {t("stripeBannerEnvMissing")}
          </span>
        )}
      </span>
    </section>
  );
}
