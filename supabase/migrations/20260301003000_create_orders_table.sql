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

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'orders'
      and policyname = 'allow_insert_anon_authenticated_orders'
  ) then
    create policy "allow_insert_anon_authenticated_orders"
      on public.orders
      for insert
      to anon, authenticated
      with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'orders'
      and policyname = 'allow_select_service_role_orders'
  ) then
    create policy "allow_select_service_role_orders"
      on public.orders
      for select
      to service_role
      using (true);
  end if;
end
$$;