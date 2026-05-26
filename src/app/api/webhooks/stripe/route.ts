import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { isStripeConfigured } from "@/lib/env";
import { handleAccountUpdated } from "@/lib/stripe/connect";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GRADUATION_THRESHOLD_CENTS } from "@/lib/products";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    console.error("[stripe webhook]", event.type, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.metadata?.purchase_id || !session.metadata?.product_id) return;

  const admin = createAdminClient();
  const purchaseId = session.metadata.purchase_id;
  const productId = session.metadata.product_id;

  // Idempotency: skip if already paid
  const { data: existing } = await admin
    .from("purchases")
    .select("status, product_id")
    .eq("id", purchaseId)
    .single();

  if (!existing || existing.status === "paid") return;

  // Get product + maker info for Early Backer + graduation check
  const { data: product } = await admin
    .from("products")
    .select(
      "id, maker_id, published_at, early_backer_ends_at, early_backer_purchase_cap, purchase_count, price_cents"
    )
    .eq("id", productId)
    .single();

  if (!product) return;

  const now = new Date().toISOString();
  const isEarlyBacker =
    !!product.published_at &&
    !!product.early_backer_ends_at &&
    new Date(product.early_backer_ends_at).getTime() > Date.now() &&
    product.purchase_count < product.early_backer_purchase_cap;

  // Mark purchase as paid
  await admin
    .from("purchases")
    .update({
      status: "paid",
      is_early_backer: isEarlyBacker,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
    })
    .eq("id", purchaseId);

  // Increment product purchase_count
  await admin
    .from("products")
    .update({ purchase_count: product.purchase_count + 1 })
    .eq("id", productId);

  // Update maker's internal revenue + check graduation
  const { data: makerProfile } = await admin
    .from("profiles")
    .select("total_internal_revenue_cents, total_external_revenue_cents, graduated_at")
    .eq("id", product.maker_id)
    .single();

  if (makerProfile) {
    // maker_net_cents from this purchase
    const { data: purchase } = await admin
      .from("purchases")
      .select("maker_net_cents")
      .eq("id", purchaseId)
      .single();

    const newInternal =
      makerProfile.total_internal_revenue_cents + (purchase?.maker_net_cents ?? 0);
    const totalRevenue = newInternal + makerProfile.total_external_revenue_cents;
    const shouldGraduate =
      !makerProfile.graduated_at && totalRevenue >= GRADUATION_THRESHOLD_CENTS;

    await admin
      .from("profiles")
      .update({
        total_internal_revenue_cents: newInternal,
        ...(shouldGraduate ? { graduated_at: now } : {}),
      })
      .eq("id", product.maker_id);
  }
}
