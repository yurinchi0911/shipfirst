import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductForm } from "@/components/maker/product-form";
import { EMPTY_PRODUCT_FORM } from "@/lib/product-form-defaults";
import { isSupabaseConfigured } from "@/lib/env";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "maker" });
  return { title: t("newTitle") };
}

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupabaseConfigured()) {
    redirect(`/${locale as Locale}/login?error=setup`);
  }

  const t = await getTranslations("maker");
  const tCommon = await getTranslations("common");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link
        href="/maker"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6")}
      >
        ← {tCommon("backToMyPage")}
      </Link>
      <h1 className="text-2xl font-bold">{t("newTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("newHint")}</p>
      <div className="mt-8">
        <ProductForm defaults={EMPTY_PRODUCT_FORM} />
      </div>
    </div>
  );
}
