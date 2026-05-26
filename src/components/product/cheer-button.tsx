"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleCheer } from "@/app/[locale]/products/[id]/actions";

type Props = {
  productId: string;
  initialCount: number;
  initialCheered: boolean;
  isLoggedIn: boolean;
};

export function CheerButton({ productId, initialCount, initialCheered, isLoggedIn }: Props) {
  const t = useTranslations("product");
  const [cheered, setCheered] = useState(initialCheered);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleCheer() {
    if (!isLoggedIn) return;
    const next = !cheered;
    setCheered(next);
    setCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    startTransition(async () => {
      const result = await toggleCheer(productId);
      if (result.error) {
        setCheered(!next);
        setCount((c) => (next ? Math.max(0, c - 1) : c + 1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleCheer}
      disabled={isPending || !isLoggedIn}
      aria-label={cheered ? t("cheerDone") : t("cheerLabel")}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        cheered
          ? "border-pink-400/50 bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400"
          : "border-border bg-background text-muted-foreground hover:border-pink-300 hover:text-pink-500",
        !isLoggedIn && "opacity-50 cursor-default"
      )}
    >
      <Heart className={cn("size-4", cheered && "fill-current")} aria-hidden />
      <span>{cheered ? t("cheerDone") : t("cheerLabel")}</span>
      {count > 0 && <span className="tabular-nums">{count}</span>}
    </button>
  );
}
