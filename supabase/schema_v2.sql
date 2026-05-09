-- =====================================================================
-- FieldForce — Schema v2 add-ons
-- Run AFTER schema.sql in Supabase Dashboard → SQL Editor
-- Adds tables for: orders, attendance, daily_reports, visits_log, notifications
-- Plus RPCs to manage users (toggle status, update profile)
-- =====================================================================

-- ---------- ORDERS ----------
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  customer_id   uuid references public.customers(id),
  outlet_name   text not null,
  order_date    date not null default current_date,
  amount        numeric(12,2) not null default 0,
  products      text,
  status        text not null default 'pending' check (status in ('pending','approved','delivered','cancelled')),
  created_at    timestamptz not null default now()
);
create index if not exists idx_orders_user_date on public.orders (user_id, order_date desc);

-- ---------- ATTENDANCE ----------
create table if not exists public.attendance (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  att_date    date not null default current_date,
  status      text not null default 'present' check (status in ('present','absent','leave')),
  check_in    text,
  created_at  timestamptz not null default now(),
  unique (user_id, att_date)
);

-- ---------- DAILY REPORTS ----------
create table if not exists public.daily_reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  report_date   date not null,
  visits_count  int  not null default 0,
  new_outlets   int  not null default 0,
  orders_value  numeric(12,2) not null default 0,
  collections   numeric(12,2) not null default 0,
  notes         text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_daily_reports_user_date on public.daily_reports (user_id, report_date desc);

-- ---------- VISITS LOG (simple outlet visit log) ----------
create table if not exists public.visits_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  outlet_name  text not null,
  visit_date   date not null default current_date,
  status       text not null default 'productive' check (status in ('productive','non-productive')),
  remarks      text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_visits_log_user_date on public.visits_log (user_id, visit_date desc);

-- ---------- NOTIFICATIONS ----------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  title       text not null,
  body        text,
  type        text not null default 'info' check (type in ('reminder','alert','info')),
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- USER ADMIN RPCs
-- =====================================================================
create or replace function public.set_user_status(p_user_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('active','inactive') then raise exception 'bad status'; end if;
  update public.users set status = p_status where id = p_user_id;
end $$;

create or replace function public.update_user_password(p_user_id uuid, p_new_password text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.users set password_hash = crypt(p_new_password, gen_salt('bf', 10)) where id = p_user_id;
end $$;

-- =====================================================================
-- RLS — permissive (custom auth). Tighten when migrating to Supabase Auth.
-- =====================================================================
alter table public.orders         enable row level security;
alter table public.attendance     enable row level security;
alter table public.daily_reports  enable row level security;
alter table public.visits_log     enable row level security;
alter table public.notifications  enable row level security;

do $$ begin
  create policy "rw orders"        on public.orders        for all using (true) with check (true);
  create policy "rw attendance"    on public.attendance    for all using (true) with check (true);
  create policy "rw daily_reports" on public.daily_reports for all using (true) with check (true);
  create policy "rw visits_log"    on public.visits_log    for all using (true) with check (true);
  create policy "rw notifications" on public.notifications for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

-- Allow updates to users table from anon for status toggling via RPC only is preferred,
-- but to support direct updates needed by Users admin page during custom-auth phase:
do $$ begin
  create policy "write users" on public.users for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

-- =====================================================================
-- Seed a few demo users so Team / Dashboard have data to show.
-- Safe to re-run; uses 'where not exists'.
-- =====================================================================
select public.create_user('manager', 'manager123', 'Priya Iyer',   'manager',   'South')
  where not exists (select 1 from public.users where username = 'manager');
select public.create_user('hr',      'hr123',      'Anil Kapoor',  'hr',        null)
  where not exists (select 1 from public.users where username = 'hr');
select public.create_user('sales1',  'sales123',   'Vikram Singh', 'executive', 'South')
  where not exists (select 1 from public.users where username = 'sales1');
select public.create_user('sales2',  'sales123',   'Neha Verma',   'executive', 'South')
  where not exists (select 1 from public.users where username = 'sales2');
select public.create_user('sales3',  'sales123',   'Arjun Mehta',  'executive', 'North')
  where not exists (select 1 from public.users where username = 'sales3');
