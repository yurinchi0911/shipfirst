import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function RevenueBadge({ className }: { className?: string }) {
  const t = useTranslations("badges");
  return (
    <span
      title={t("revenueTip")}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400",
        className
      )}
    >
      <Zap className="size-3 fill-current" aria-hidden />
      {t("revenue")}
    </span>
  );
}
