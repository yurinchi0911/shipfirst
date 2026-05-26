export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;

  return true;
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}

export function isStripeConfigured(): boolean {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  return Boolean(secret?.startsWith("sk_") && publishable?.startsWith("pk_"));
}

export function getPlatformFeePercent(): number {
  const raw = process.env.PLATFORM_FEE_PERCENT?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 15;
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 15;
}
