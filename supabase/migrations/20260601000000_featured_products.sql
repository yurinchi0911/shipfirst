-- products に is_featured フラグを追加
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- featured を先頭に表示するためのインデックス
CREATE INDEX IF NOT EXISTS idx_products_is_featured
  ON public.products (is_featured, published_at DESC)
  WHERE status = 'published';
