import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Ship } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const t = await getTranslations("common");
  const locale = await getLocale();
  let userEmail: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userEmail = user?.email ?? null;
    } catch {
      userEmail = null;
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <Ship className="size-5 text-primary" aria-hidden />
          <span>{t("brand")}</span>
        </Link>

        <nav
          className="flex max-w-[min(100vw-8rem,20rem)] shrink-0 items-center gap-0.5 overflow-x-auto sm:max-w-none sm:gap-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:overflow-visible [&::-webkit-scrollbar]:hidden"
          aria-label="Main"
        >
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0")}
          >
            {t("navProducts")}
          </Link>
          <Link
            href="/maker/products/new"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "shrink-0 sm:inline-flex"
            )}
          >
            <span className="sm:hidden">{t("navListShort")}</span>
            <span className="hidden sm:inline">{t("navList")}</span>
          </Link>
          <LocaleSwitcher />
          {userEmail ? (
            <>
          <Link
              href="/account/purchases"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "shrink-0"
              )}
            >
              <span className="sm:hidden">{t("navPurchasesShort")}</span>
              <span className="hidden sm:inline">{t("navPurchases")}</span>
            </Link>
            <Link
              href="/account/wishlist"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "shrink-0"
              )}
            >
              {t("navWishlist")}
            </Link>
            <Link
              href="/maker"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "max-w-[4.5rem] shrink-0 truncate sm:max-w-[120px]"
              )}
              title={userEmail}
            >
              {t("navMyPage")}
            </Link>
            <form action={`/${locale}/auth/signout`} method="post" className="shrink-0">
              <button
                type="submit"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                <span className="sr-only sm:not-sr-only sm:inline">{t("navLogout")}</span>
                <span className="sm:hidden" aria-hidden>
                  ↪
                </span>
              </button>
            </form>
            </>
          ) : (
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
            >
              {t("navLogin")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
