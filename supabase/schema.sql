create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null,
  phone text not null,
  type text not null check (type in ('entrega', 'retirada')),
  address text not null,
  payment text not null,
  items jsonb not null,
  notes text,
  total numeric(10,2) not null default 0
);

alter table public.orders enable row level security;

create policy "allow_insert_anon"
  on public.orders
  for insert
  to anon, authenticated
  with check (true);

create policy "allow_select_service_role"
  on public.orders
  for select
  to service_role
  using (true);