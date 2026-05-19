/**
 * デモ用プロダクトを2件投入（maker-test@shipfirst.dev 向け）
 * 使い方: npm run seed
 */
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
nextEnv.loadEnvConfig(projectRoot);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const makerEmail = process.env.SEED_MAKER_EMAIL?.trim() || "maker-test@shipfirst.dev";

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です。");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const now = new Date();
const earlyBackerEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
const publishedAt = now.toISOString();

const refundPolicy =
  "ご購入から14日以内であれば、理由を問わず全額返金いたします。\n返金をご希望の場合は、購入時のメールアドレスからサポートまでご連絡ください。\n通常2〜3営業日で処理します。";

const products = [
  {
    name: "FocusTimer Pro",
    description:
      "バイブコーダー向けの集中タイマー SaaS。ポモドーロ・タスク連携・週次レポート付き。サブスクはいつでもキャンセル可能で、購入前に価格と退会方法が明示されています。",
    price_cents: 1200,
    billing_type: "subscription",
    trial_days: 7,
    trial_terms:
      "7日間の無料トライアル終了後、自動的に月額課金が開始されます。トライアル中にキャンセルすれば課金されません。",
    cancel_policy_ack: true,
  },
  {
    name: "VibeLanding Kit",
    description:
      "AI でランディングページを数分で公開。テンプレート・フォーム・分析ダッシュボード付きの買い切りテンプレート。返金ポリシーと価格を購入前に確認できます。",
    price_cents: 4900,
    billing_type: "one_time",
    trial_days: 0,
    trial_terms: null,
    cancel_policy_ack: false,
  },
];

const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("id, email")
  .eq("email", makerEmail)
  .maybeSingle();

if (profileError || !profile) {
  console.error(
    `プロファイルが見つかりません: ${makerEmail}\n先にテストユーザーを作成してください。`
  );
  process.exit(1);
}

for (const demo of products) {
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("maker_id", profile.id)
    .eq("name", demo.name)
    .maybeSingle();

  const row = {
    maker_id: profile.id,
    name: demo.name,
    description: demo.description,
    price_cents: demo.price_cents,
    currency: "usd",
    billing_type: demo.billing_type,
    trial_days: demo.trial_days,
    trial_terms: demo.trial_terms,
    cancel_url: "https://example.com/cancel",
    refund_policy: refundPolicy,
    refund_policy_template_id: 1,
    cancel_policy_ack: demo.cancel_policy_ack,
    delivery_url: "https://example.com/welcome",
    status: "published",
    fair_deal: true,
    fair_deal_fail_reasons: [],
    fair_deal_checked_at: publishedAt,
    published_at: publishedAt,
    early_backer_ends_at: earlyBackerEnds,
    purchase_count: 0,
  };

  if (existing) {
    const { error } = await supabase.from("products").update(row).eq("id", existing.id);
    if (error) {
      console.error(`更新失敗 (${demo.name}):`, error.message);
      process.exit(1);
    }
    console.log(`更新: ${demo.name} (${existing.id})`);
  } else {
    const { data: created, error } = await supabase
      .from("products")
      .insert(row)
      .select("id")
      .single();
    if (error) {
      console.error(`作成失敗 (${demo.name}):`, error.message);
      process.exit(1);
    }
    console.log(`作成: ${demo.name} (${created.id})`);
  }
}

console.log(`\n完了 — ${makerEmail} のデモプロダクトがトップに表示されます。`);
