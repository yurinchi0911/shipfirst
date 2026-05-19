"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { stripLocalePrefix } from "@/lib/locale-path";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  // middleware 不調時でも /ja/ja にならないようロケール接頭辞を除去
  const pathWithoutLocale = stripLocalePrefix(
    pathname.startsWith("/") ? pathname : `/${pathname}`
  );

  return (
    <div
      className="flex items-center gap-1"
      aria-label={t("language")}
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          disabled={loc === locale}
          onClick={() => router.replace(pathWithoutLocale, { locale: loc })}
          className={cn(
            buttonVariants({
              variant: locale === loc ? "secondary" : "ghost",
              size: "sm",
            }),
            "min-w-9 px-2 uppercase"
          )}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
