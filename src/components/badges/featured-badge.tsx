import { cn } from "@/lib/utils";

export function FeaturedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400",
        className
      )}
    >
      <span aria-hidden>⭐</span>
      Featured
    </span>
  );
}
