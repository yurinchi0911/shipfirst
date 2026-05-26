import { useTranslations } from "next-intl";
import { Trophy, AlertCircle } from "lucide-react";
import { formatGraduationProgress } from "@/lib/graduation";

type Props = {
  internalCents: number;
  externalCents: number;
  graduated: boolean;
};

export function GraduationBanner({ internalCents, externalCents, graduated }: Props) {
  const t = useTranslations("maker");
  const { remaining } = formatGraduationProgress(internalCents, externalCents);

  if (graduated) {
    return (
      <section
        role="status"
        className="flex gap-4 rounded-xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-4 sm:p-5"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
          <Trophy className="size-5" aria-hidden />
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-medium">{t("graduationBannerTitle")}</span>
          <span className="text-sm text-muted-foreground">{t("graduationBannerBody")}</span>
        </span>
      </section>
    );
  }

  return (
    <section
      role="status"
      className="flex gap-4 rounded-xl border border-violet-500/25 bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent p-4 sm:p-5"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-700 dark:text-violet-400">
        <AlertCircle className="size-5" aria-hidden />
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-medium">{t("graduatingBannerTitle", { remaining })}</span>
        <span className="text-sm text-muted-foreground">{t("graduatingBannerBody")}</span>
      </span>
    </section>
  );
}
