import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  localeFromPathname,
  normalizeNextPath,
  resolveLocalizedPath,
} from "@/lib/locale-path";
import { routing, type Locale } from "@/i18n/routing";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const locale =
    localeFromPathname(url.pathname) ?? (routing.defaultLocale as Locale);
  const next = resolveLocalizedPath(url.searchParams.get("next"), locale);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${url.origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${url.origin}/${locale}/login?error=auth_callback&next=${encodeURIComponent(normalizeNextPath(url.searchParams.get("next")))}`
  );
}
