-- products に thumbnail_url を追加
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Supabase Storage: product-images バケットを作成（public）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: 認証ユーザーは自分のフォルダのみアップロード可
CREATE POLICY "makers can upload own product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage RLS: 誰でも読み取り可
CREATE POLICY "product images are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Storage RLS: オーナーのみ削除可
CREATE POLICY "makers can delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
