"use client";

import { useTranslations } from "next-intl";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function FairDealBadge({ className }: { className?: string }) {
  const t = useTranslations("badges");

  return (
    <span
      title={t("fairDealTip")}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400",
        className
      )}
    >
      <BadgeCheck className="size-3.5" aria-hidden />
      {t("fairDeal")}
    </span>
  );
}
