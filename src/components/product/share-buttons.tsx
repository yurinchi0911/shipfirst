"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  productId: string;
  productName: string;
};

export function ShareButtons({ productId, productName }: Props) {
  const t = useTranslations("product");
  const [copied, setCopied] = useState(false);

  const APP_URL =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://shipfirst.vercel.app";
  const url = `${APP_URL}/en/products/${productId}`;
  const tweetText = `${productName} — just found this on ShipFirst 🚀\n${url}\n\n#ShipFirst #indie`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{t("share")}</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
      >
        <Button variant="outline" size="sm" className="gap-1.5 h-8 px-3 font-bold">
          <span className="text-xs font-black" aria-hidden>𝕏</span>
          <span className="text-xs">Post</span>
        </Button>
      </a>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 px-3"
        onClick={handleCopy}
      >
        <Link2 className="size-3.5" aria-hidden />
        <span className="text-xs">{copied ? t("shareCopied") : t("shareCopy")}</span>
      </Button>
    </div>
  );
}
