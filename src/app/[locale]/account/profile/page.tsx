import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { ProfileEditForm } from "@/components/account/profile-edit-form";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileEdit" });
  return { title: t("title") };
}

export default async function ProfileEditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as Locale;

  if (!isSupabaseConfigured()) redirect(`/${loc}/login?error=setup`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${loc}/login?next=/account/profile`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, sns_links")
    .eq("id", user.id)
    .single();

  const t = await getTranslations("profileEdit");
  const tCommon = await getTranslations("common");
  const sns = (profile?.sns_links ?? {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <Link
        href="/maker"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6")}
      >
        ← {tCommon("backToMyPage")}
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-8">
        <ProfileEditForm
          defaultValues={{
            display_name: profile?.display_name ?? "",
            bio: profile?.bio ?? "",
            sns_twitter: sns.twitter ?? "",
            sns_github: sns.github ?? "",
            sns_website: sns.website ?? "",
          }}
          userId={user.id}
        />
      </div>
    </div>
  );
}
