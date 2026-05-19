"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function EarlyBackerBadge({
  className,
  slotsLeft,
}: {
  className?: string;
  slotsLeft?: number;
}) {
  const t = useTranslations("badges");

  return (
    <span
      title={t("earlyBackerTip")}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400",
        className
      )}
    >
      <Sparkles className="size-3.5" aria-hidden />
      {t("earlyBacker")}
      {slotsLeft !== undefined && slotsLeft > 0 && (
        <span className="text-orange-600/80 dark:text-orange-300/80">
          {t("slotsLeft", { n: slotsLeft })}
        </span>
      )}
    </span>
  );
}
