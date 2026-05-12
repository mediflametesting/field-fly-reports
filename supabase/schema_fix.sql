-- =====================================================================
-- FieldForce — Schema FIX (run in Supabase SQL Editor)
-- Aligns live schema with services and opens RLS for the anon key
-- since the app uses custom username/password auth (not Supabase Auth).
-- Idempotent: safe to run multiple times.
-- =====================================================================

-- ---------- COMPANIES: ensure expected columns ----------
alter table public.companies add column if not exists company_code text;
alter table public.companies add column if not exists brand        text;
alter table public.companies add column if not exists status       text;
update public.companies set status = 'active' where status is null;

-- ---------- CUSTOMERS: ensure expected columns ----------
alter table public.customers add column if not exists place          text;
alter table public.customers add column if not exists contact_person text;
alter table public.customers add column if not exists contact_number text;
alter table public.customers add column if not exists gst_number     text;
alter table public.customers add column if not exists status         text;
update public.customers set status = 'active' where status is null;

-- ---------- USERS: convert boolean status -> text 'active'/'inactive' ----------
do $$
declare v_type text;
begin
  select data_type into v_type from information_schema.columns
   where table_schema='public' and table_name='users' and column_name='status';
  if v_type = 'boolean' then
    alter table public.users add column if not exists status_new text;
    update public.users set status_new = case when status then 'active' else 'inactive' end;
    alter table public.users drop column status;
    alter table public.users rename column status_new to status;
  end if;
end $$;
alter table public.users alter column status set default 'active';
update public.users set status = 'active' where status is null;

-- ---------- ROLES: make readable + seeded ----------
create table if not exists public.roles_text (role_name text primary key);
insert into public.roles_text(role_name) values ('admin'),('manager'),('hr'),('executive')
  on conflict do nothing;

-- Ensure roles table (whatever the original PK type) has the four canonical rows
do $$
declare v_id_type text;
begin
  select data_type into v_id_type from information_schema.columns
   where table_schema='public' and table_name='roles' and column_name='id';
  if v_id_type is null then
    create table public.roles (id serial primary key, role_name text unique not null);
  end if;
  insert into public.roles (role_name)
    select rn from (values('admin'),('manager'),('hr'),('executive')) v(rn)
    where not exists (select 1 from public.roles r where r.role_name = v.rn);
end $$;

-- =====================================================================
-- RLS — permissive policies for the anon key (custom auth in app)
-- =====================================================================
do $$
declare t text;
begin
  for t in select unnest(array[
    'roles','users','customers','companies','visit_reports','attachments',
    'orders','attendance','daily_reports','visits_log','notifications'
  ]) loop
    if exists (select 1 from information_schema.tables
               where table_schema='public' and table_name=t) then
      execute format('alter table public.%I enable row level security', t);
      -- drop any pre-existing policies on the table
      perform 1; -- noop
      for t in select policyname from pg_policies
                where schemaname='public' and tablename = t loop
        -- handled below
        null;
      end loop;
    end if;
  end loop;
end $$;

-- Drop old policies cleanly, then create open ones (anon role).
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname='public'
       and tablename in ('roles','users','customers','companies','visit_reports',
                         'attachments','orders','attendance','daily_reports',
                         'visits_log','notifications')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'roles','users','customers','companies','visit_reports','attachments',
    'orders','attendance','daily_reports','visits_log','notifications'
  ]) loop
    if exists (select 1 from information_schema.tables
               where table_schema='public' and table_name=t) then
      execute format(
        'create policy "anon read %1$s"  on public.%1$I for select using (true)', t);
      execute format(
        'create policy "anon write %1$s" on public.%1$I for all using (true) with check (true)', t);
    end if;
  end loop;
end $$;

-- =====================================================================
-- RPCs — set_user_status + create_user (re-create to match text status)
-- =====================================================================
create or replace function public.set_user_status(p_user_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('active','inactive') then
    raise exception 'Invalid status: %', p_status;
  end if;
  update public.users set status = p_status where id = p_user_id;
end $$;

grant execute on function public.set_user_status(uuid, text) to anon, authenticated;
grant execute on function public.create_user(text, text, text, text, text) to anon, authenticated;
grant execute on function public.verify_login(text, text)                  to anon, authenticated;
