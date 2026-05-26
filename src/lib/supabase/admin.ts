import { createClient } from "@supabase/supabase-js";

/** Webhook などサーバー専用。クライアントやブラウザから使わない */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
