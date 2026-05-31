import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://shipfirst.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ["en", "ja"];
  const now = new Date().toISOString();

  const staticPages = ["/", "/login"].flatMap((path) =>
    locales.map((locale) => ({
      url: `${APP_URL}/${locale}${path === "/" ? "" : path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1.0 : 0.5,
    }))
  );

  let productPages: MetadataRoute.Sitemap = [];
  let makerPages: MetadataRoute.Sitemap = [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();

    const { data: products } = await supabase
      .from("products")
      .select("id, updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(500);

    productPages = (products ?? []).flatMap((p) =>
      locales.map((locale) => ({
        url: `${APP_URL}/${locale}/products/${p.id}`,
        lastModified: p.updated_at ?? now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
    );

    const { data: makers } = await supabase
      .from("profiles")
      .select("id, updated_at")
      .eq("role", "maker")
      .limit(500);

    makerPages = (makers ?? []).flatMap((m) =>
      locales.map((locale) => ({
        url: `${APP_URL}/${locale}/makers/${m.id}`,
        lastModified: m.updated_at ?? now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }))
    );
  }

  return [...staticPages, ...productPages, ...makerPages];
}
