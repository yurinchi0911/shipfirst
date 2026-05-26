-- v2 残り適用分
-- profiles・products のカラムは既に手動適用済みのため IF NOT EXISTS で安全スキップ

-- ─── 手動適用漏れのカラム（total_internal_revenue_cents）──────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_internal_revenue_cents integer NOT NULL DEFAULT 0;

-- sns_links の NOT NULL 制約を補完（手動で nullable として作成された場合）
ALTER TABLE public.profiles
  ALTER COLUMN sns_links SET DEFAULT '{}',
  ALTER COLUMN sns_links SET NOT NULL;
-- ↑ すでに NOT NULL なら PostgreSQL はエラーを出さず通過します

-- ─── 新テーブル群 ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.wishlists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (buyer_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.product_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body        text NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 1000),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER product_comments_set_updated_at
  BEFORE UPDATE ON public.product_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.cheer_reactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.feature_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  vote_count  integer NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feature_request_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.maker_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maker_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES public.products(id) ON DELETE SET NULL,
  body        text NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 2000),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── インデックス ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS wishlists_buyer_id_idx   ON public.wishlists (buyer_id);
CREATE INDEX IF NOT EXISTS wishlists_product_id_idx ON public.wishlists (product_id);
CREATE INDEX IF NOT EXISTS comments_product_id_idx  ON public.product_comments (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cheer_product_id_idx     ON public.cheer_reactions (product_id);
CREATE INDEX IF NOT EXISTS freq_product_id_idx      ON public.feature_requests (product_id, vote_count DESC);
CREATE INDEX IF NOT EXISTS posts_maker_id_idx       ON public.maker_posts (maker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS products_category_idx    ON public.products (category) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS products_cheer_idx       ON public.products (cheer_count DESC) WHERE status = 'published';

-- ─── RLS 有効化 ───────────────────────────────────────────────────────────────
ALTER TABLE public.wishlists             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheer_reactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_request_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maker_posts           ENABLE ROW LEVEL SECURITY;

-- ─── RLS ポリシー ─────────────────────────────────────────────────────────────

-- wishlists
CREATE POLICY "Users manage own wishlist"
  ON public.wishlists FOR ALL
  USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

-- comments
CREATE POLICY "Public read comments"
  ON public.product_comments FOR SELECT USING (true);
CREATE POLICY "Auth write comments"
  ON public.product_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author delete comment"
  ON public.product_comments FOR DELETE USING (auth.uid() = author_id);

-- cheers
CREATE POLICY "Public read cheers"
  ON public.cheer_reactions FOR SELECT USING (true);
CREATE POLICY "Auth cheer"
  ON public.cheer_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User uncheer"
  ON public.cheer_reactions FOR DELETE USING (auth.uid() = user_id);

-- feature_requests
CREATE POLICY "Public read feature_requests"
  ON public.feature_requests FOR SELECT USING (true);
CREATE POLICY "Auth submit feature_request"
  ON public.feature_requests FOR INSERT WITH CHECK (auth.uid() = author_id);

-- feature_request_votes
CREATE POLICY "Public read votes"
  ON public.feature_request_votes FOR SELECT USING (true);
CREATE POLICY "Auth vote"
  ON public.feature_request_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User unvote"
  ON public.feature_request_votes FOR DELETE USING (auth.uid() = user_id);

-- maker_posts
CREATE POLICY "Public read maker_posts"
  ON public.maker_posts FOR SELECT USING (true);
CREATE POLICY "Maker write posts"
  ON public.maker_posts FOR INSERT WITH CHECK (auth.uid() = maker_id);
CREATE POLICY "Maker delete posts"
  ON public.maker_posts FOR DELETE USING (auth.uid() = maker_id);

-- ─── profiles: 公開プロフィール読み取り許可 ─────────────────────────────────
-- 既存の "Users read own profile" ポリシーを削除して公開読み取りに変更
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;

CREATE POLICY "Public read profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
