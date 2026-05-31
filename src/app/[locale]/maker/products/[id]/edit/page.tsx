import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductForm } from "@/components/maker/product-form";
import { ProductImageUpload } from "@/components/maker/product-image-upload";
import { productToFormDefaults } from "@/lib/product-form-defaults";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "maker" });
  return { title: t("editTitle") };
}

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { locale, id } = await params;
  const loc = locale as Locale;

  if (!isSupabaseConfigured()) redirect(`/${loc}/login?error=setup`);

  const { saved } = await searchParams;
  const t = await getTranslations("maker");
  const tCommon = await getTranslations("common");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `/${loc}/login?next=${encodeURIComponent(`/maker/products/${id}/edit`)}`
    );
  }

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, description, price_cents, billing_type, trial_days, trial_terms, cancel_url, refund_policy, refund_policy_template_id, cancel_policy_ack, delivery_url, lemon_squeezy_url, thumbnail_url, status, maker_id, category, problem_tags"
    )
    .eq("id", id)
    .single();

  if (!product || product.maker_id !== user.id) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link
        href="/maker"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6")}
      >
        ← {tCommon("backToMyPage")}
      </Link>
      <h1 className="text-2xl font-bold">{t("editTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {product.status === "published" ? t("statusPublished") : t("statusDraft")}
      </p>
      {saved === "draft" && (
        <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
          {t("draftSaved")}
        </p>
      )}
      <div className="mt-8 space-y-8">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ProductImageUpload productId={product.id} currentUrl={(product as any).thumbnail_url} />
        <ProductForm
          defaults={productToFormDefaults(product)}
          productId={product.id}
        />
      </div>
      {product.status === "published" && (
        <Link
          href={`/products/${product.id}`}
          className={cn(buttonVariants({ variant: "link" }), "mt-4 inline-flex px-0")}
        >
          {t("viewPublic")}
        </Link>
      )}
    </div>
  );
}
