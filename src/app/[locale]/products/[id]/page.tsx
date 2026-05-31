import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, buildLsAffiliateUrl } from "@/lib/env";
import Image from "next/image";
import {
  earlyBackerSlotsLeft,
  formatPrice,
  isEarlyBackerActive,
  type ProductDetail,
} from "@/lib/products";
import { FairDealBadge } from "@/components/badges/fair-deal-badge";
import { EarlyBackerBadge } from "@/components/badges/early-backer-badge";
import { LsBadge } from "@/components/badges/ls-badge";
import { BuyButton } from "@/components/product/buy-button";
import { CheerButton } from "@/components/product/cheer-button";
import { WishlistButton } from "@/components/product/wishlist-button";
import { CommentSection } from "@/components/product/comment-section";
import { FeatureRequestSection } from "@/components/product/feature-request-section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Comment, FeatureRequest } from "@/types/database";

async function getProduct(id: string): Promise<ProductDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, name, description, price_cents, currency, billing_type, fair_deal,
       published_at, early_backer_ends_at, early_backer_purchase_cap, purchase_count,
       cancel_url, refund_policy, trial_days, trial_terms, delivery_url,
       lemon_squeezy_url,
       category, problem_tags, cheer_count, maker_id,
       maker:profiles!maker_id (id, display_name)`
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as ProductDetail;
}

async function getComments(productId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_comments")
    .select(
      "id, product_id, author_id, body, created_at, updated_at, author:profiles!author_id(display_name)"
    )
    .eq("product_id", productId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as Comment[];
}

async function getFeatureRequests(
  productId: string,
  userId: string | null
): Promise<FeatureRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("feature_requests")
    .select("id, product_id, author_id, title, vote_count, created_at")
    .eq("product_id", productId)
    .order("vote_count", { ascending: false });

  const requests = (data ?? []) as FeatureRequest[];

  if (userId && requests.length > 0) {
    const { data: votes } = await supabase
      .from("feature_request_votes")
      .select("request_id")
      .eq("user_id", userId)
      .in(
        "request_id",
        requests.map((r) => r.id)
      );
    const votedSet = new Set(
      (votes ?? []).map((v: { request_id: string }) => v.request_id)
    );
    return requests.map((r) => ({ ...r, user_voted: votedSet.has(r.id) }));
  }
  return requests;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) return { title: "Product" };
  const product = await getProduct(id);
  if (!product) return { title: "Product" };

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://shipfirst.vercel.app";
  const maker = Array.isArray(product.maker) ? product.maker[0] : product.maker;
  const description = product.description.slice(0, 160);
  const productUrl = `${APP_URL}/products/${id}`;

  return {
    title: product.name,
    description,
    openGraph: {
      type: "website",
      url: productUrl,
      title: `${product.name} | ShipFirst`,
      description,
      images: [
        {
          url: `${APP_URL}/api/og?title=${encodeURIComponent(product.name)}&sub=${encodeURIComponent(description)}&type=product`,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      siteName: "ShipFirst",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ShipFirst`,
      description,
      images: [`${APP_URL}/api/og?title=${encodeURIComponent(product.name)}&sub=${encodeURIComponent(description)}&type=product`],
    },
    alternates: {
      canonical: productUrl,
    },
    other: {
      "product:maker": maker?.display_name ?? "",
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  if (!isSupabaseConfigured()) notFound();

  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const t = await getTranslations("product");
  const tCard = await getTranslations("card");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [comments, featureRequests] = await Promise.all([
    getComments(id),
    getFeatureRequests(id, user?.id ?? null),
  ]);

  let userCheered = false;
  let userWishlisted = false;
  if (user) {
    const [{ data: cheer }, { data: wish }] = await Promise.all([
      supabase
        .from("cheer_reactions")
        .select("id")
        .eq("product_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("wishlists")
        .select("id")
        .eq("product_id", id)
        .eq("buyer_id", user.id)
        .maybeSingle(),
    ]);
    userCheered = !!cheer;
    userWishlisted = !!wish;
  }

  const showEarlyBacker = isEarlyBackerActive(product);
  const maker = Array.isArray(product.maker) ? product.maker[0] : product.maker;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawLsUrl = (product as any).lemon_squeezy_url as string | null ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const thumbnailUrl = (product as any).thumbnail_url as string | null ?? null;
  const affiliateUrl = rawLsUrl ? buildLsAffiliateUrl(rawLsUrl) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Back */}
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-8 -ml-2"
        )}
      >
        ← {t("back")}
      </Link>

      {/* Two-column layout on desktop */}
      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        {/* ── Left: content ──────────────────────────────── */}
        <div className="min-w-0">
          {/* Badges */}
          {(product.fair_deal || showEarlyBacker || rawLsUrl) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {product.fair_deal && <FairDealBadge />}
              {showEarlyBacker && (
                <EarlyBackerBadge slotsLeft={earlyBackerSlotsLeft(product)} />
              )}
              {rawLsUrl && <LsBadge />}
            </div>
          )}

          {/* Thumbnail */}
          {thumbnailUrl && (
            <div className="mb-6 overflow-hidden rounded-2xl border bg-muted/20">
              <Image
                src={thumbnailUrl}
                alt={product.name}
                width={800}
                height={400}
                className="w-full object-cover"
                unoptimized
              />
            </div>
          )}

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {product.name}
          </h1>

          {/* Category + tags */}
          {(product.category ||
            (product.problem_tags && product.problem_tags.length > 0)) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.category && (
                <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                  {product.category}
                </span>
              )}
              {product.problem_tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs text-primary/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Maker */}
          {maker?.display_name && (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t("makerLabel")}</span>
              <Link
                href={`/makers/${maker.id}`}
                className="font-medium text-foreground hover:underline"
              >
                {maker.display_name}
              </Link>
              <span aria-hidden className="opacity-40">·</span>
              <Link
                href={`/makers/${maker.id}`}
                className="text-xs hover:underline"
              >
                {t("viewMakerProfile")}
              </Link>
            </p>
          )}

          {/* Description */}
          <div className="mt-8 rounded-2xl border bg-muted/10 p-6">
            <p className="whitespace-pre-wrap leading-loose text-foreground/90">
              {product.description}
            </p>
          </div>

          {/* Cheer + Wishlist */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <CheerButton
              productId={id}
              initialCount={product.cheer_count}
              initialCheered={userCheered}
              isLoggedIn={!!user}
            />
            <WishlistButton
              productId={id}
              initialWishlisted={userWishlisted}
              isLoggedIn={!!user}
            />
          </div>

          {/* Pre-purchase details */}
          <section className="mt-10 space-y-5 rounded-2xl border bg-muted/10 p-6 text-sm">
            <h2 className="font-semibold">{t("beforeBuy")}</h2>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("cancelUrl")}
              </p>
              <a
                href={product.cancel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-primary underline-offset-4 hover:underline"
              >
                {product.cancel_url}
              </a>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("refundPolicy")}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">
                {product.refund_policy}
              </p>
            </div>
            {product.trial_days > 0 && product.trial_terms && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("trialTerms")}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {product.trial_terms}
                </p>
              </div>
            )}
          </section>

          {/* Community */}
          <hr className="my-10 border-border/60" />
          <CommentSection
            productId={id}
            initialComments={comments}
            currentUserId={user?.id ?? null}
          />
          <FeatureRequestSection
            productId={id}
            initialRequests={featureRequests}
            currentUserId={user?.id ?? null}
          />
        </div>

        {/* ── Right: buy box (sticky) ─────────────────────── */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border bg-card p-6 shadow-sm ring-1 ring-foreground/[0.04]">
            {/* Price */}
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums tracking-tight">
                {formatPrice(product.price_cents, product.currency)}
              </span>
              <span className="text-sm text-muted-foreground">
                {product.billing_type === "subscription"
                  ? tCard("subscription")
                  : tCard("oneTime")}
              </span>
            </div>
            {product.trial_days > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {t("trialDays", { days: product.trial_days })}
              </p>
            )}

            {/* Buy CTA */}
            <div className="mt-5 flex flex-col gap-2">
              <BuyButton lemonSqueezyUrl={affiliateUrl} />
              <Link
                href="/maker/products/new"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "w-full justify-center text-muted-foreground"
                )}
              >
                {t("listYours")}
              </Link>
            </div>

            {/* Fair Deal mini summary */}
            {product.fair_deal && (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3 text-xs dark:bg-emerald-950/20">
                <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                <p className="text-emerald-800 dark:text-emerald-300">
                  {t("fairDealNote")}
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
