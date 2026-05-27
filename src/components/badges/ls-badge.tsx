"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function LsBadge({ className }: { className?: string }) {
  const t = useTranslations("badges");
  return (
    <span
      title={t("lsTip")}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-yellow-400/15 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400",
        className
      )}
    >
      <span aria-hidden>🍋</span>
      {t("ls")}
    </span>
  );
}
