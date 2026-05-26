"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";

type ActionResult = { error?: string; success?: boolean };

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "login_required" };

  const display_name = formData.get("display_name")?.toString().trim() || null;
  const bio = formData.get("bio")?.toString().trim() || null;
  const twitter = formData.get("sns_twitter")?.toString().trim() || undefined;
  const github = formData.get("sns_github")?.toString().trim() || undefined;
  const website = formData.get("sns_website")?.toString().trim() || undefined;

  const sns_links: Record<string, string> = {};
  if (twitter) sns_links.twitter = twitter.replace(/^@/, "");
  if (github) sns_links.github = github;
  if (website) sns_links.website = website;

  const { error } = await supabase
    .from("profiles")
    .update({ display_name, bio, sns_links })
    .eq("id", user.id);

  if (error) return { error: error.message };

  for (const loc of routing.locales) {
    revalidatePath(`/${loc}/account/profile`);
    revalidatePath(`/${loc}/makers/${user.id}`);
    revalidatePath(`/${loc}/maker`);
  }
  return { success: true };
}
