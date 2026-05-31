import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_LIST_SELECT, type ProductListItem } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { LsBadge } from "@/components/badges/ls-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MakerPost } from "@/types/database";

type Sns = {
  twitter?: string;
  github?: string;
  website?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) return { title: "Maker" };
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, bio")
    .eq("id", id)
    .single();

  const name = data?.display_name ?? "Maker";
  const description = data?.bio
    ? `${data.bio.slice(0, 140)} — ShipFirst`
    : `${name}'s products on ShipFirst — the marketplace for first-time makers.`;

  return {
    title: `${name}'s products`,
    description,
    openGraph: {
      title: `${name} | ShipFirst`,
      description,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(name)}&sub=${encodeURIComponent(description)}&type=maker`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | ShipFirst`,
      description,
      images: [`/api/og?title=${encodeURIComponent(name)}&sub=${encodeURIComponent(description)}&type=maker`],
    },
  };
}

export default async function MakerProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  if (!isSupabaseConfigured()) notFound();

  const { id } = await params;
  const t = await getTranslations("profile");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, bio, sns_links, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!profile) notFound();

  const [{ data: productsRaw }, { data: postsRaw }] = await Promise.all([
    supabase
      .from("products")
      .select(PRODUCT_LIST_SELECT)
      .eq("maker_id", id)
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    supabase
      .from("maker_posts")
      .select("id, maker_id, product_id, body, created_at")
      .eq("maker_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const products = (productsRaw ?? []) as unknown as ProductListItem[];
  const posts = (postsRaw ?? []) as MakerPost[];
  const sns = (profile.sns_links ?? {}) as Sns;
  const name = profile.display_name ?? "Maker";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6")}
      >
        ← Discover
      </Link>

      {/* Profile header */}
      <section className="flex items-start gap-5">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
            {products.some(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (p) => !!(p as any).lemon_squeezy_url
            ) && <LsBadge />}
          </div>
          {profile.bio && (
            <p className="mt-2 text-muted-foreground">{profile.bio}</p>
          )}
          {/* SNS links */}
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {sns.website && (
              <a
                href={sns.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Website
              </a>
            )}
            {sns.twitter && (
              <a
                href={`https://twitter.com/${sns.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @{sns.twitter}
              </a>
            )}
            {sns.github && (
              <a
                href={`https://github.com/${sns.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub
              </a>
            )}
          </div>
        </span>
      </section>

      {/* Products */}
      <section className="mt-12 space-y-5">
        <h2 className="text-xl font-semibold">{t("products")}</h2>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noProducts")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Posts */}
      {posts.length > 0 && (
        <section className="mt-12 space-y-5">
          <h2 className="text-xl font-semibold">{t("posts")}</h2>
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id} className="rounded-xl border bg-muted/20 p-4 text-sm">
                <p className="whitespace-pre-wrap">{post.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
