"use client";

import { useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function GraduatingBadge({ className }: { className?: string }) {
  const t = useTranslations("home");
  return (
    <span
      title={t("graduatingTip")}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-400",
        className
      )}
    >
      <TrendingUp className="size-3" aria-hidden />
      {t("graduatingLabel")}
    </span>
  );
}
