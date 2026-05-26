import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { PRODUCT_LIST_SELECT, type ProductListItem } from "@/lib/products";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as Locale;

  if (!isSupabaseConfigured()) {
    redirect(`/${loc}/login?error=setup`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${loc}/login?next=${encodeURIComponent(`/account/wishlist`)}`);
  }

  const t = await getTranslations("account");

  const { data: raw } = await supabase
    .from("wishlists")
    .select(`product:products!product_id(${PRODUCT_LIST_SELECT})`)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const products = (raw ?? [])
    .map((row) => {
      const p = Array.isArray(row.product) ? row.product[0] : row.product;
      return p as unknown as ProductListItem;
    })
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6")}
      >
        {t("backHome")}
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">{t("wishlistTitle")}</h1>

      <div className="mt-8">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/25 p-12 text-center text-sm text-muted-foreground">
            {t("wishlistEmpty")}
            <br />
            <Link href="/" className="mt-2 inline-block font-medium underline">
              {t("browseProducts")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
