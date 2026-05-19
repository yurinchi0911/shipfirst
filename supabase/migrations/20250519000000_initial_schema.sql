-- ShipFirst MVP: profiles, products, purchases + RLS

-- profiles（auth.users と 1:1）
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'maker' check (role in ('maker', 'buyer', 'admin')),
  stripe_account_id text unique,
  stripe_onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- products
create type public.product_status as enum ('draft', 'published', 'archived');
create type public.billing_type as enum ('one_time', 'subscription');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  maker_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text not null,
  price_cents integer not null check (price_cents > 0),
  currency text not null default 'usd',
  billing_type public.billing_type not null default 'one_time',
  trial_days integer not null default 0 check (trial_days >= 0),
  trial_terms text,
  cancel_url text not null,
  refund_policy text not null,
  refund_policy_template_id smallint,
  cancel_policy_ack boolean not null default false,
  delivery_url text,
  status public.product_status not null default 'draft',
  fair_deal boolean not null default false,
  fair_deal_fail_reasons text[] not null default '{}',
  fair_deal_checked_at timestamptz,
  published_at timestamptz,
  early_backer_ends_at timestamptz,
  early_backer_purchase_cap integer not null default 50,
  purchase_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_status_published_at_idx on public.products (status, published_at desc);
create index products_maker_id_idx on public.products (maker_id);

-- purchases
create type public.purchase_status as enum ('pending', 'paid', 'refunded', 'failed');

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  buyer_id uuid references public.profiles(id),
  buyer_email text not null,
  amount_cents integer not null,
  platform_fee_cents integer not null,
  maker_net_cents integer not null,
  currency text not null default 'usd',
  status public.purchase_status not null default 'pending',
  is_early_backer boolean not null default false,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create index purchases_buyer_id_idx on public.purchases (buyer_id);
create index purchases_product_id_idx on public.purchases (product_id);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.purchases enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Public read published products"
  on public.products for select
  using (status = 'published');

create policy "Makers manage own products"
  on public.products for all
  using (auth.uid() = maker_id)
  with check (auth.uid() = maker_id);

create policy "Buyers read own purchases"
  on public.purchases for select
  using (auth.uid() = buyer_id);

create policy "Makers read product purchases"
  on public.purchases for select
  using (
    exists (
      select 1 from public.products p
      where p.id = purchases.product_id and p.maker_id = auth.uid()
    )
  );

-- purchases insert/update: service role only (no client policies)
