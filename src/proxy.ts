import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { isSupabaseConfigured } from "@/lib/env";
import {
  localeFromPathname,
  normalizeNextPath,
  resolveLocalizedPath,
  stripLocalePrefix,
  withLocalePrefix,
} from "@/lib/locale-path";
import { updateSession } from "@/lib/supabase/middleware";

const handleI18n = createIntlMiddleware(routing);

const protectedPrefixes = ["/maker", "/account"];

function isProtectedPath(pathWithoutLocale: string) {
  return protectedPrefixes.some(
    (prefix) =>
      pathWithoutLocale === prefix ||
      pathWithoutLocale.startsWith(`${prefix}/`)
  );
}

/** Supabase の Set-Cookie を next-intl のレスポンスへマージする */
function mergeCookies(
  target: NextResponse,
  source: NextResponse
): NextResponse {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value);
  });
  return target;
}

export async function proxy(request: NextRequest) {
  const intlResponse = handleI18n(request);

  if (
    intlResponse.headers.get("location") &&
    intlResponse.status >= 300 &&
    intlResponse.status < 400
  ) {
    return intlResponse;
  }

  const pathname = request.nextUrl.pathname;
  const pathWithoutLocale = stripLocalePrefix(pathname);
  const locale = localeFromPathname(pathname) ?? routing.defaultLocale;

  if (!isSupabaseConfigured()) {
    if (isProtectedPath(pathWithoutLocale)) {
      const url = request.nextUrl.clone();
      url.pathname = withLocalePrefix("/login", locale);
      url.searchParams.set("error", "setup");
      return NextResponse.redirect(url);
    }
    return intlResponse;
  }

  const { response: authResponse, user } = await updateSession(request);

  if (!user && isProtectedPath(pathWithoutLocale)) {
    const url = request.nextUrl.clone();
    url.pathname = withLocalePrefix("/login", locale);
    url.searchParams.set(
      "next",
      pathWithoutLocale === "/" ? "/maker" : pathWithoutLocale
    );
    return NextResponse.redirect(url);
  }

  if (user && pathWithoutLocale === "/login") {
    const next = resolveLocalizedPath(
      request.nextUrl.searchParams.get("next"),
      locale
    );
    return NextResponse.redirect(new URL(next, request.url));
  }

  // next-intl の rewrite / ヘッダーを維持したまま Supabase セッションを反映
  return mergeCookies(intlResponse, authResponse);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
