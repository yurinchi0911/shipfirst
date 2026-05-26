-- ShipFirst v2: graduation system, community features, discovery

-- ─── profiles: graduation & public data ───────────────────────────────────────
alter table public.profiles
  add column if not exists bio text,
  add column if not exists sns_links jsonb not null default '{}',
  add column if not exists total_internal_revenue_cents integer not null default 0,
  add column if not exists total_external_revenue_cents integer not null default 0,
  add column if not exists graduated_at timestamptz;

-- ─── products: discovery metadata ─────────────────────────────────────────────
alter table public.products
  add column if not exists category text,
  add column if not exists problem_tags text[] not null default '{}',
  add column if not exists cheer_count integer not null default 0;

-- ─── wishlists ─────────────────────────────────────────────────────────────────
create table if not exists public.wishlists (
  id          uuid primary key default gen_random_uuid(),
  buyer_id    uuid not null references public.profiles(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (buyer_id, product_id)
);

-- ─── product_comments ─────────────────────────────────────────────────────────
create table if not exists public.product_comments (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) >= 1 and char_length(body) <= 1000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger product_comments_set_updated_at
  before update on public.product_comments
  for each row execute function public.set_updated_at();

-- ─── cheer_reactions ──────────────────────────────────────────────────────────
create table if not exists public.cheer_reactions (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (product_id, user_id)
);

-- ─── feature_requests ─────────────────────────────────────────────────────────
create table if not exists public.feature_requests (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (char_length(title) >= 3 and char_length(title) <= 200),
  vote_count  integer not null default 1,
  created_at  timestamptz not null default now()
);

create table if not exists public.feature_request_votes (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.feature_requests(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (request_id, user_id)
);

-- ─── maker_posts ──────────────────────────────────────────────────────────────
create table if not exists public.maker_posts (
  id          uuid primary key default gen_random_uuid(),
  maker_id    uuid not null references public.profiles(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  body        text not null check (char_length(body) >= 1 and char_length(body) <= 2000),
  created_at  timestamptz not null default now()
);

-- ─── indexes ──────────────────────────────────────────────────────────────────
create index if not exists wishlists_buyer_id_idx      on public.wishlists (buyer_id);
create index if not exists wishlists_product_id_idx    on public.wishlists (product_id);
create index if not exists comments_product_id_idx     on public.product_comments (product_id, created_at desc);
create index if not exists cheer_product_id_idx        on public.cheer_reactions (product_id);
create index if not exists freq_product_id_idx         on public.feature_requests (product_id, vote_count desc);
create index if not exists posts_maker_id_idx          on public.maker_posts (maker_id, created_at desc);
create index if not exists products_category_idx       on public.products (category) where status = 'published';
create index if not exists products_cheer_idx          on public.products (cheer_count desc) where status = 'published';

-- ─── RLS: new tables ──────────────────────────────────────────────────────────
alter table public.wishlists          enable row level security;
alter table public.product_comments   enable row level security;
alter table public.cheer_reactions    enable row level security;
alter table public.feature_requests   enable row level security;
alter table public.feature_request_votes enable row level security;
alter table public.maker_posts        enable row level security;

-- wishlists
create policy "Users manage own wishlist"
  on public.wishlists for all
  using (auth.uid() = buyer_id) with check (auth.uid() = buyer_id);

-- comments
create policy "Public read comments"   on public.product_comments for select using (true);
create policy "Auth write comments"    on public.product_comments for insert with check (auth.uid() = author_id);
create policy "Author delete comment"  on public.product_comments for delete using (auth.uid() = author_id);

-- cheers
create policy "Public read cheers"   on public.cheer_reactions for select using (true);
create policy "Auth cheer"           on public.cheer_reactions for insert with check (auth.uid() = user_id);
create policy "User uncheer"         on public.cheer_reactions for delete using (auth.uid() = user_id);

-- feature requests
create policy "Public read feature_requests"
  on public.feature_requests for select using (true);
create policy "Auth submit feature_request"
  on public.feature_requests for insert with check (auth.uid() = author_id);

-- feature request votes
create policy "Public read votes"  on public.feature_request_votes for select using (true);
create policy "Auth vote"          on public.feature_request_votes for insert with check (auth.uid() = user_id);
create policy "User unvote"        on public.feature_request_votes for delete using (auth.uid() = user_id);

-- maker_posts
create policy "Public read maker_posts" on public.maker_posts for select using (true);
create policy "Maker write posts"  on public.maker_posts for insert with check (auth.uid() = maker_id);
create policy "Maker delete posts" on public.maker_posts for delete using (auth.uid() = maker_id);

-- ─── profiles: allow public read (non-email fields queried by app only) ────────
-- Drop old self-only read policy and replace with public read
-- (email is never selected in public-facing queries)
drop policy if exists "Users read own profile" on public.profiles;

create policy "Public read profiles"
  on public.profiles for select using (true);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
