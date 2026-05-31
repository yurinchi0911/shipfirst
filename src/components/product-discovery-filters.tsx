"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { X } from "lucide-react";
import { PRODUCT_CATEGORIES, PROBLEM_TAGS } from "@/lib/products";
import { cn } from "@/lib/utils";

export function ProductDiscoveryFilters() {
  const t = useTranslations("home");
  const tCat = useTranslations("categories");
  const tTag = useTranslations("problemTags");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const maxPrice = searchParams.get("max_price") ?? "";
  const lsOnly = searchParams.get("ls_only") === "1";
  const query = searchParams.get("q") ?? "";
  const hasFilters = category || tag || maxPrice || lsOnly || query;

  const update = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // keep tab
      router.replace(`/${locale}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, locale]
  );

  function clearAll() {
    const params = new URLSearchParams();
    const tab = searchParams.get("tab");
    if (tab) params.set("tab", tab);
    router.replace(`/${locale}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-3">
    {/* Search bar */}
    <input
      type="search"
      value={query}
      onChange={(e) => update("q", e.target.value || null)}
      placeholder={t("searchPlaceholder")}
      className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    />

    <div className="flex flex-wrap items-center gap-2 text-sm">
      {/* Category */}
      <select
        value={category}
        onChange={(e) => update("category", e.target.value || null)}
        className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        aria-label={t("filterCategory")}
      >
        <option value="">{t("filterCategory")}</option>
        {PRODUCT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {tCat(c)}
          </option>
        ))}
      </select>

      {/* Problem tag */}
      <select
        value={tag}
        onChange={(e) => update("tag", e.target.value || null)}
        className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        aria-label={t("filterTag")}
      >
        <option value="">{t("filterTag")}</option>
        {PROBLEM_TAGS.map((tg) => (
          <option key={tg} value={tg}>
            {tTag(tg)}
          </option>
        ))}
      </select>

      {/* Max price */}
      <input
        type="number"
        min="0"
        step="1"
        value={maxPrice}
        onChange={(e) => update("max_price", e.target.value || null)}
        placeholder={t("filterPrice")}
        className="h-8 w-28 rounded-lg border border-input bg-background px-2.5 text-sm"
      />

      {/* LemonSqueezy only toggle */}
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 h-8 select-none">
        <input
          type="checkbox"
          checked={lsOnly}
          onChange={(e) => update("ls_only", e.target.checked ? "1" : null)}
          className="size-3.5"
        />
        <span className="text-xs">🍋 {t("filterLsOnly")}</span>
      </label>

      {/* Clear */}
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:border-destructive/50 hover:text-destructive"
          )}
        >
          <X className="size-3" aria-hidden />
          {t("filterClear")}
        </button>
      )}
    </div>
    </div>
  );
}
