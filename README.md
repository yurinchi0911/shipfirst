# ShipFirst

バイブコーダー向けマーケットプレイス MVP（掲載無料・売上15%・Fair Deal バッジ）。

## 開発

```bash
npm install
cp .env.example .env.local   # Supabase の値を入力
npm run dev                    # http://localhost:3000
```

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー（ポート 3000） |
| `npm run build` | 本番ビルド |
| `npm run test` | Fair Deal ユニットテスト |
| `npm run seed` | デモプロダクト投入（要 service role） |

## ドキュメント

`../docs/shipfirst/` に設計・タスク一覧があります。

- [Week 1 タスク](../docs/shipfirst/04-week1-tasks.md)
- [Vercel デプロイ](../docs/shipfirst/05-deploy-vercel.md)
- [Week 2 タスク](../docs/shipfirst/06-week2-tasks.md)

## 本番 URL

| | |
|--|--|
| サイト | https://shipfirst.vercel.app |
| Vercel | https://vercel.com/yurinchis-projects/shipfirst/9q4BNpxce5SQGqWouerniEHypW3r |

## Vercel デプロイ（要約）

1. Root Directory = `shipfirst`（モノレポの場合）
2. 環境変数: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL=https://shipfirst.vercel.app`
3. Supabase Redirect: `https://shipfirst.vercel.app/en/auth/callback` と `/ja/auth/callback`

詳細は [05-deploy-vercel.md](../docs/shipfirst/05-deploy-vercel.md)。

## Week 1 スコープ

- 認証・掲載・Fair Deal・Early Backer 表示
- Stripe 購入は Week 2
