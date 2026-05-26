import { NextResponse } from "next/server";
import { isStripeConfigured, getPlatformFeePercent, getAppUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { routing, type Locale } from "@/i18n/routing";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let productId: string;
  let locale: Locale = routing.defaultLocale;
  try {
    const body = (await request.json()) as { product_id?: string; locale?: string };
    if (!body.product_id) {
      return NextResponse.json({ error: "product_id required" }, { status: 400 });
    }
    productId = body.product_id;
    if (body.locale && routing.locales.includes(body.locale as Locale)) {
      locale = body.locale as Locale;
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Get product + maker stripe info
  const { data: product, error: productError } = await supabase
    .from("products")
    .select(
      "id, name, price_cents, currency, billing_type, status, maker_id, maker:profiles!maker_id(stripe_account_id, stripe_onboarding_complete, graduated_at)"
    )
    .eq("id", productId)
    .eq("status", "published")
    .maybeSingle();

  if (productError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const maker = Array.isArray(product.maker) ? product.maker[0] : product.maker;

  if (!maker?.stripe_onboarding_complete || !maker?.stripe_account_id) {
    return NextResponse.json(
      { error: "Maker has not set up payments yet" },
      { status: 400 }
    );
  }

  if (maker.graduated_at) {
    return NextResponse.json(
      { error: "This maker has graduated and no longer accepts new purchases" },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const admin = createAdminClient();
  const appUrl = getAppUrl();
  const feePercent = getPlatformFeePercent();
  const amount = product.price_cents;
  const platformFee = Math.floor(amount * (feePercent / 100));
  const makerNet = amount - platformFee;

  // Create pending purchase (service role — client RLS doesn't allow insert)
  const { data: purchase, error: purchaseError } = await admin
    .from("purchases")
    .insert({
      product_id: productId,
      buyer_id: user.id,
      buyer_email: user.email,
      amount_cents: amount,
      platform_fee_cents: platformFee,
      maker_net_cents: makerNet,
      currency: product.currency ?? "usd",
      status: "pending",
    })
    .select("id")
    .single();

  if (purchaseError || !purchase) {
    return NextResponse.json({ error: purchaseError?.message ?? "DB error" }, { status: 500 });
  }

  try {
    const isSubscription = product.billing_type === "subscription";
    const baseParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: isSubscription ? "subscription" : "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: product.currency ?? "usd",
            unit_amount: amount,
            product_data: { name: product.name },
            ...(isSubscription ? { recurring: { interval: "month" } } : {}),
          },
          quantity: 1,
        },
      ],
      metadata: {
        purchase_id: purchase.id,
        product_id: productId,
        buyer_id: user.id,
      },
      success_url: `${appUrl}/${locale}/purchase/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${locale}/products/${productId}`,
    };

    if (isSubscription) {
      baseParams.subscription_data = {
        application_fee_percent: feePercent,
        transfer_data: { destination: maker.stripe_account_id },
      };
    } else {
      baseParams.payment_intent_data = {
        application_fee_amount: platformFee,
        transfer_data: { destination: maker.stripe_account_id },
      };
    }

    const session = await stripe.checkout.sessions.create(baseParams);

    // Attach session ID to the pending purchase
    await admin
      .from("purchases")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", purchase.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Clean up pending purchase on Stripe error
    await admin.from("purchases").delete().eq("id", purchase.id);
    const message = err instanceof Error ? err.message : "Checkout creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
