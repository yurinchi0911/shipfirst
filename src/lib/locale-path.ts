import { locales, type Locale } from "@/i18n/routing";

/** `/en/maker` → `/maker` */
export function stripLocalePrefix(pathname: string): string {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1);
    }
  }
  return pathname;
}

export function withLocalePrefix(path: string, locale: Locale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

export function localeFromPathname(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  return locales.includes(segment as Locale) ? (segment as Locale) : null;
}

/** `/ja/maker` → `/maker`（next-intl の router.push 用） */
export function normalizeNextPath(
  path: string | null | undefined,
  fallback = "/maker"
): string {
  if (!path?.startsWith("/")) return fallback;
  const stripped = stripLocalePrefix(path);
  return stripped === "/" ? fallback : stripped;
}

/** サーバー側リダイレクト用のロケール付きパス */
export function resolveLocalizedPath(
  path: string | null | undefined,
  locale: Locale
): string {
  return withLocalePrefix(normalizeNextPath(path), locale);
}
