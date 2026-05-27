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

/** ShipFirst の LemonSqueezy アフィリエイトコード */
export function getLsAffiliateCode(): string {
  return process.env.NEXT_PUBLIC_LS_AFFILIATE_CODE?.trim() ?? "";
}

/** LemonSqueezy URL にアフィリエイトコードを付与する */
export function buildLsAffiliateUrl(productUrl: string): string {
  const code = getLsAffiliateCode();
  if (!code || !productUrl) return productUrl;
  try {
    const url = new URL(productUrl);
    url.searchParams.set("aff", code);
    return url.toString();
  } catch {
    return productUrl;
  }
}
