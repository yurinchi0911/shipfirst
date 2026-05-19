import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { isSupabaseConfigured } from "@/lib/env";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeNextPath } from "@/lib/locale-path";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "login" });
  return { title: t("title") };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { locale } = await params;
  const loc = locale as Locale;
  const sp = await searchParams;
  const t = await getTranslations("login");
  const tCommon = await getTranslations("common");

  const nextPath = normalizeNextPath(
    sp.next?.startsWith("/") ? sp.next : null
  );

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold">{t("setupTitle")}</h1>
        <p className="mt-4 text-muted-foreground">{t("setupBody")}</p>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "mt-8 inline-flex")}
        >
          {tCommon("backToHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 sm:px-6">
      {sp.error === "setup" && (
        <p className="mb-4 w-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t("errorSetup")}
        </p>
      )}
      {sp.error === "auth_callback" && (
        <p className="mb-4 w-full rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t("errorCallback")}
        </p>
      )}
      <LoginForm nextPath={nextPath} />
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-6")}
      >
        {tCommon("backToHome")}
      </Link>
    </div>
  );
}
