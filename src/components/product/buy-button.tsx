"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type Props = {
  lemonSqueezyUrl: string | null;
};

export function BuyButton({ lemonSqueezyUrl }: Props) {
  const t = useTranslations("product");

  if (!lemonSqueezyUrl) {
    return (
      <Button disabled className="w-full">
        {t("buyUnavailable")}
      </Button>
    );
  }

  return (
    <a
      href={lemonSqueezyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full"
    >
      <Button className="w-full gap-2">
        <span>🍋</span>
        {t("buy")}
      </Button>
    </a>
  );
}
