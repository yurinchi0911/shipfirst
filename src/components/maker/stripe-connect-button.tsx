"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function StripeConnectButton() {
  const t = useTranslations("maker");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? t("stripeConnectError"));
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("stripeConnectError"));
      setLoading(false);
    }
  }

  return (
    <span className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button type="button" size="sm" onClick={handleConnect} disabled={loading}>
        {loading ? t("stripeConnectLoading") : t("stripeConnectCta")}
      </Button>
      {error && (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
