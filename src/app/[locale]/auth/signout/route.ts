import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { localeFromPathname } from "@/lib/locale-path";
import { routing, type Locale } from "@/i18n/routing";

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  const url = new URL(request.url);
  const locale =
    localeFromPathname(url.pathname) ?? (routing.defaultLocale as Locale);

  return NextResponse.redirect(new URL(`/${locale}`, url.origin), {
    status: 303,
  });
}
