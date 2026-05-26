"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  productId: string;
  isLoggedIn: boolean;
  makerStripeConnected: boolean;
};

export function BuyButton({ productId, isLoggedIn, makerStripeConnected }: Props) {
  const t = useTranslations("product");
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <Button
        className="sm:flex-1"
        onClick={() =>
          router.push(`/login?next=/products/${productId}`)
        }
      >
        {t("buyLogin")}
      </Button>
    );
  }

  if (!makerStripeConnected) {
    return (
      <Button disabled className="sm:flex-1">
        {t("buyUnavailable")}
      </Button>
    );
  }

  async function handleBuy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, locale }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setLoading(false);
    }
  }

  return (
    <span className="flex flex-1 flex-col gap-1">
      <Button onClick={handleBuy} disabled={loading} className="w-full">
        {loading ? "…" : t("buy")}
      </Button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </span>
  );
}
