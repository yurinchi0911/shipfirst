import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  earlyBackerSlotsLeft,
  formatPrice,
  isEarlyBackerActive,
  type ProductDetail,
} from "@/lib/products";
import { FairDealBadge } from "@/components/badges/fair-deal-badge";
import { EarlyBackerBadge } from "@/components/badges/early-backer-badge";
import { RevenueBadge } from "@/components/badges/revenue-badge";
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
       category, problem_tags, cheer_count, maker_id,
       maker:profiles!maker_id (id, display_name, stripe_onboarding_complete, stripe_account_id)`
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
    .select("id, product_id, author_id, body, created_at, updated_at, author:profiles!author_id(display_name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as Comment[];
}

async function getFeatureRequests(productId: string, userId: string | null): Promise<FeatureRequest[]> {
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
      .in("request_id", requests.map((r) => r.id));
    const votedSet = new Set((votes ?? []).map((v: { request_id: string }) => v.request_id));
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
  return { title: product?.name ?? "Product" };
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

  // Check if user has cheered
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6")}
      >
        {t("back")}
      </Link>

      {/* Badges */}
      <div className="mb-4 flex flex-wrap gap-2">
        {product.fair_deal && <FairDealBadge />}
        {showEarlyBacker && <EarlyBackerBadge slotsLeft={earlyBackerSlotsLeft(product)} />}
        {maker?.stripe_onboarding_complete && <RevenueBadge />}
      </div>

      <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

      {/* Maker line */}
      {maker?.display_name && (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t("makerLabel")}</span>
          <Link
            href={`/makers/${maker.id}`}
            className="font-medium text-foreground hover:underline"
          >
            {maker.display_name}
          </Link>
          <span aria-hidden>·</span>
          <Link href={`/makers/${maker.id}`} className="hover:underline text-xs">
            {t("viewMakerProfile")}
          </Link>
        </p>
      )}

      {/* Price */}
      <div className="mt-5 flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-bold tabular-nums">
          {formatPrice(product.price_cents, product.currency)}
        </span>
        <span className="text-sm text-muted-foreground">
          {product.billing_type === "subscription" ? tCard("subscription") : tCard("oneTime")}
        </span>
        {product.trial_days > 0 && (
          <span className="text-sm text-muted-foreground">
            · {t("trialDays", { days: product.trial_days })}
          </span>
        )}
      </div>

      {/* Description */}
      <div className="mt-8">
        <p className="whitespace-pre-wrap leading-relaxed text-foreground">
          {product.description}
        </p>
      </div>

      {/* Cheer + Wishlist row */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
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

      {/* Buy */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <BuyButton
          productId={id}
          isLoggedIn={!!user}
          makerStripeConnected={maker?.stripe_onboarding_complete ?? false}
        />
        <Link
          href="/maker/products/new"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "sm:flex-1 text-center"
          )}
        >
          {t("listYours")}
        </Link>
      </div>

      {/* Pre-purchase details */}
      <section className="mt-10 space-y-4 rounded-2xl border bg-muted/20 p-6 text-sm">
        <h2 className="font-semibold">{t("beforeBuy")}</h2>
        <div>
          <dt className="text-muted-foreground">{t("cancelUrl")}</dt>
          <dd className="mt-1">
            <a
              href={product.cancel_url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-primary underline-offset-4 hover:underline"
            >
              {product.cancel_url}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("refundPolicy")}</dt>
          <dd className="mt-1 whitespace-pre-wrap">{product.refund_policy}</dd>
        </div>
        {product.trial_days > 0 && product.trial_terms && (
          <div>
            <dt className="text-muted-foreground">{t("trialTerms")}</dt>
            <dd className="mt-1 whitespace-pre-wrap">{product.trial_terms}</dd>
          </div>
        )}
      </section>

      {/* Community */}
      <hr className="my-10 border-border" />

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
  );
}
