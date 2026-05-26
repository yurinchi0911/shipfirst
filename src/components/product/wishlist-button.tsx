"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleWishlist } from "@/app/[locale]/products/[id]/actions";

type Props = {
  productId: string;
  initialWishlisted: boolean;
  isLoggedIn: boolean;
};

export function WishlistButton({ productId, initialWishlisted, isLoggedIn }: Props) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    if (!isLoggedIn) return;
    const next = !wishlisted;
    setWishlisted(next);
    startTransition(async () => {
      const result = await toggleWishlist(productId);
      if (result.error) setWishlisted(!next);
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending || !isLoggedIn}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "inline-flex items-center justify-center rounded-full border p-2 transition-colors",
        wishlisted
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
        !isLoggedIn && "opacity-40 cursor-default"
      )}
    >
      <Bookmark className={cn("size-4", wishlisted && "fill-current")} aria-hidden />
    </button>
  );
}
