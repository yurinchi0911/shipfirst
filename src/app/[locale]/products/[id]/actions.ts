"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";
import { sendCheerNotification, sendCommentNotification } from "@/lib/email";

type ActionResult = { error?: string; success?: boolean };

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null as null };
  return { supabase, user };
}

function revalidateProduct(productId: string) {
  for (const loc of routing.locales) {
    revalidatePath(`/${loc}/products/${productId}`);
  }
}

// ─── Cheer ────────────────────────────────────────────────────────────────────

export async function toggleCheer(
  productId: string
): Promise<ActionResult & { cheered?: boolean; count?: number }> {
  const { supabase, user } = await requireAuth();
  if (!user) return { error: "login_required" };

  // Check existing cheer
  const { data: existing } = await supabase
    .from("cheer_reactions")
    .select("id")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("cheer_reactions")
      .delete()
      .eq("product_id", productId)
      .eq("user_id", user.id);
    const { data: prod } = await supabase
      .from("products")
      .select("cheer_count")
      .eq("id", productId)
      .single();
    if (prod) {
      await supabase
        .from("products")
        .update({ cheer_count: Math.max(0, prod.cheer_count - 1) })
        .eq("id", productId);
    }
    revalidateProduct(productId);
    return { success: true, cheered: false };
  }

  await supabase.from("cheer_reactions").insert({ product_id: productId, user_id: user.id });
  const { data: latestProd } = await supabase
    .from("products")
    .select("cheer_count, name, maker_id")
    .eq("id", productId)
    .single();
  if (latestProd) {
    await supabase
      .from("products")
      .update({ cheer_count: latestProd.cheer_count + 1 })
      .eq("id", productId);

    // メーカーにメール通知（fire-and-forget）
    const { data: cheerer } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    const { data: maker } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("id", latestProd.maker_id)
      .single();
    if (maker && maker.email && latestProd.maker_id !== user.id) {
      sendCheerNotification({
        makerEmail: maker.email,
        makerName: maker.display_name ?? "メーカー",
        productName: latestProd.name,
        productId,
        cheererName: cheerer?.display_name ?? undefined,
      }).catch(() => {});
    }
  }
  revalidateProduct(productId);
  return { success: true, cheered: true };
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function addComment(
  productId: string,
  body: string
): Promise<ActionResult> {
  const { supabase, user } = await requireAuth();
  if (!user) return { error: "login_required" };

  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 1000) return { error: "invalid_body" };

  const { error } = await supabase.from("product_comments").insert({
    product_id: productId,
    author_id: user.id,
    body: trimmed,
  });

  if (error) return { error: error.message };

  // メーカーにメール通知（fire-and-forget）
  const { data: product } = await supabase
    .from("products")
    .select("name, maker_id")
    .eq("id", productId)
    .single();
  if (product) {
    const [{ data: commenter }, { data: maker }] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", user.id).single(),
      supabase.from("profiles").select("email, display_name").eq("id", product.maker_id).single(),
    ]);
    if (maker && maker.email && product.maker_id !== user.id) {
      sendCommentNotification({
        makerEmail: maker.email,
        makerName: maker.display_name ?? "メーカー",
        productName: product.name,
        productId,
        commenterName: commenter?.display_name ?? undefined,
        commentBody: trimmed,
      }).catch(() => {});
    }
  }

  revalidateProduct(productId);
  return { success: true };
}

export async function deleteComment(
  commentId: string,
  productId: string
): Promise<ActionResult> {
  const { supabase, user } = await requireAuth();
  if (!user) return { error: "login_required" };

  const { error } = await supabase
    .from("product_comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id);

  if (error) return { error: error.message };
  revalidateProduct(productId);
  return { success: true };
}

// ─── Feature Requests ─────────────────────────────────────────────────────────

export async function addFeatureRequest(
  productId: string,
  title: string
): Promise<ActionResult> {
  const { supabase, user } = await requireAuth();
  if (!user) return { error: "login_required" };

  const trimmed = title.trim();
  if (trimmed.length < 3 || trimmed.length > 200) return { error: "invalid_title" };

  const { error } = await supabase.from("feature_requests").insert({
    product_id: productId,
    author_id: user.id,
    title: trimmed,
    vote_count: 1,
  });

  if (error) return { error: error.message };
  revalidateProduct(productId);
  return { success: true };
}

export async function toggleFeatureVote(
  requestId: string,
  productId: string
): Promise<ActionResult & { voted?: boolean }> {
  const { supabase, user } = await requireAuth();
  if (!user) return { error: "login_required" };

  const { data: existing } = await supabase
    .from("feature_request_votes")
    .select("id")
    .eq("request_id", requestId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: req } = await supabase
    .from("feature_requests")
    .select("vote_count")
    .eq("id", requestId)
    .single();

  if (!req) return { error: "not_found" };

  if (existing) {
    await supabase
      .from("feature_request_votes")
      .delete()
      .eq("request_id", requestId)
      .eq("user_id", user.id);
    await supabase
      .from("feature_requests")
      .update({ vote_count: Math.max(1, req.vote_count - 1) })
      .eq("id", requestId);
    revalidateProduct(productId);
    return { success: true, voted: false };
  }

  await supabase
    .from("feature_request_votes")
    .insert({ request_id: requestId, user_id: user.id });
  await supabase
    .from("feature_requests")
    .update({ vote_count: req.vote_count + 1 })
    .eq("id", requestId);
  revalidateProduct(productId);
  return { success: true, voted: true };
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export async function toggleWishlist(
  productId: string
): Promise<ActionResult & { wishlisted?: boolean }> {
  const { supabase, user } = await requireAuth();
  if (!user) return { error: "login_required" };

  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("product_id", productId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("wishlists")
      .delete()
      .eq("product_id", productId)
      .eq("buyer_id", user.id);
    revalidateProduct(productId);
    return { success: true, wishlisted: false };
  }

  await supabase
    .from("wishlists")
    .insert({ product_id: productId, buyer_id: user.id });
  revalidateProduct(productId);
  return { success: true, wishlisted: true };
}

