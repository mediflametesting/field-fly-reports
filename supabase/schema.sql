-- =====================================================================
-- FieldForce Sales Reporting — Supabase PostgreSQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ---------- ROLES ----------
create table if not exists public.roles (
  id          serial primary key,
  role_name   text unique not null
);

insert into public.roles (role_name) values
  ('admin'), ('manager'), ('hr'), ('executive')
on conflict (role_name) do nothing;

-- ---------- USERS (custom username/password) ----------
create table if not exists public.users (
  id             uuid primary key default gen_random_uuid(),
  username       text unique not null,
  password_hash  text not null,
  full_name      text not null,
  role_id        int  not null references public.roles(id),
  manager_id     uuid references public.users(id),
  region         text,
  status         text not null default 'active' check (status in ('active','inactive')),
  created_at     timestamptz not null default now()
);

-- ---------- CUSTOMERS ----------
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  customer_code   text unique not null,
  customer_name   text not null,
  place           text,
  contact_person  text,
  contact_number  text,
  gst_number      text,
  status          text not null default 'active' check (status in ('active','inactive')),
  created_at      timestamptz not null default now()
);

-- ---------- COMPANIES ----------
create table if not exists public.companies (
  id            uuid primary key default gen_random_uuid(),
  company_code  text unique,
  company_name  text not null,
  brand         text,
  status        text not null default 'active' check (status in ('active','inactive')),
  created_at    timestamptz not null default now()
);

-- ---------- VISIT REPORTS ----------
create table if not exists public.visit_reports (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  company_id          uuid references public.companies(id),
  customer_id         uuid references public.customers(id),
  visit_date          date not null,
  visit_mode          text,                  -- Direct Visit / Telephonic / WhatsApp / etc.
  approx_order_value  numeric(12,2) default 0,
  collection_amount   numeric(12,2) default 0,
  collection_mode     text,                  -- Cash / NEFT / RTGS / UPI / PDC / Cheque
  collection_details  text,
  party_feedback      text,
  next_followup_date  date,
  status              text not null default 'submitted' check (status in ('draft','submitted')),
  created_at          timestamptz not null default now()
);

create index if not exists idx_visit_reports_user_date
  on public.visit_reports (user_id, visit_date desc);

-- ---------- ATTACHMENTS ----------
create table if not exists public.attachments (
  id               uuid primary key default gen_random_uuid(),
  visit_report_id  uuid not null references public.visit_reports(id) on delete cascade,
  file_url         text not null,
  file_name        text not null,
  uploaded_at      timestamptz not null default now()
);

-- =====================================================================
-- AUTH RPCs — username/password login backed by pgcrypto bcrypt
-- =====================================================================

create or replace function public.create_user(
  p_username  text,
  p_password  text,
  p_full_name text,
  p_role      text,
  p_region    text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id int;
  v_user_id uuid;
begin
  select id into v_role_id from public.roles where role_name = p_role;
  if v_role_id is null then
    raise exception 'Unknown role: %', p_role;
  end if;

  insert into public.users (username, password_hash, full_name, role_id, region)
  values (p_username, crypt(p_password, gen_salt('bf', 10)), p_full_name, v_role_id, p_region)
  returning id into v_user_id;

  return v_user_id;
end $$;

create or replace function public.verify_login(
  p_username text,
  p_password text
) returns table (
  id        uuid,
  username  text,
  full_name text,
  role      text,
  region    text,
  status    text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select u.id, u.username, u.full_name, r.role_name, u.region, u.status
  from public.users u
  join public.roles r on r.id = u.role_id
  where u.username = p_username
    and u.status   = 'active'
    and u.password_hash = crypt(p_password, u.password_hash);
end $$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- NOTE: This app uses custom username/password auth (no Supabase Auth
-- session), so policies allow reads from anon for app data. Writes are
-- gated by the application + RPCs. If you migrate to Supabase Auth,
-- replace `using (true)` with auth.uid()-based checks.
-- =====================================================================

alter table public.users         enable row level security;
alter table public.roles         enable row level security;
alter table public.customers     enable row level security;
alter table public.companies     enable row level security;
alter table public.visit_reports enable row level security;
alter table public.attachments   enable row level security;

-- Read policies (app uses anon key)
do $$ begin
  create policy "read roles"         on public.roles         for select using (true);
  create policy "read customers"     on public.customers     for select using (true);
  create policy "read companies"     on public.companies     for select using (true);
  create policy "read visit_reports" on public.visit_reports for select using (true);
  create policy "read attachments"   on public.attachments   for select using (true);
  create policy "read users public"  on public.users         for select using (true);

  -- Write policies (anon). Tighten these once Supabase Auth is enabled.
  create policy "write customers"     on public.customers     for all using (true) with check (true);
  create policy "write companies"     on public.companies     for all using (true) with check (true);
  create policy "write visit_reports" on public.visit_reports for all using (true) with check (true);
  create policy "write attachments"   on public.attachments   for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

-- =====================================================================
-- SEED — default admin (CHANGE THE PASSWORD IMMEDIATELY)
-- =====================================================================
select public.create_user('admin', 'admin123', 'System Admin', 'admin', null)
where not exists (select 1 from public.users where username = 'admin');

-- =====================================================================
-- STORAGE — bucket for visit attachments / documents
-- Run once. If it already exists this is a no-op.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;
