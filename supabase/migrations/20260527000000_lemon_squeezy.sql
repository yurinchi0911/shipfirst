-- products に LemonSqueezy アフィリエイト URL を追加
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lemon_squeezy_url text;
