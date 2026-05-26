"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { formatGraduationProgress } from "@/lib/graduation";
import { updateExternalRevenue } from "@/app/[locale]/maker/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  internalCents: number;
  externalCents: number;
};

export function RevenueCard({ internalCents, externalCents }: Props) {
  const t = useTranslations("maker");
  const { earned, remaining, percent } = formatGraduationProgress(internalCents, externalCents);
  const [externalInput, setExternalInput] = useState(
    externalCents > 0 ? String(externalCents / 100) : ""
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const val = Number.parseFloat(externalInput);
    if (!Number.isFinite(val) || val < 0) return;
    startTransition(async () => {
      await updateExternalRevenue(val);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <section className="rounded-xl border bg-card/50 p-5 text-sm ring-1 ring-foreground/5 space-y-4">
      <h2 className="font-semibold text-base">{t("revenueTitle")}</h2>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold tabular-nums">{earned}</span>
          <span className="text-xs text-muted-foreground">{t("revenueGoal")}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {remaining} {t("revenueHint").split(".")[0]}
        </p>
      </div>

      {/* Breakdown */}
      <dl className="grid gap-2 sm:grid-cols-2 text-xs">
        <span className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
          <dt className="text-muted-foreground">{t("revenueInternal")}</dt>
          <dd className="font-medium tabular-nums">${(internalCents / 100).toFixed(2)}</dd>
        </span>
        <span className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
          <dt className="text-muted-foreground">{t("revenueExternal")}</dt>
          <dd className="font-medium tabular-nums">${(externalCents / 100).toFixed(2)}</dd>
        </span>
      </dl>

      {/* Self-report external */}
      <form onSubmit={handleSave} className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          {t("externalRevenueLabel")}
        </label>
        <div className="flex gap-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={externalInput}
            onChange={(e) => setExternalInput(e.target.value)}
            placeholder={t("externalRevenuePlaceholder")}
            disabled={isPending}
            className="flex-1"
          />
          <Button type="submit" size="sm" variant="outline" disabled={isPending}>
            {isPending ? t("externalRevenueSaving") : saved ? "✓" : t("externalRevenueSave")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("externalRevenueHint")}</p>
      </form>
    </section>
  );
}
