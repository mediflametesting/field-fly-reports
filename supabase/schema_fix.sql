-- =====================================================================
-- FieldForce — Schema FIX (run in Supabase SQL Editor)
-- Keeps status columns as BOOLEAN (true = active, false = inactive).
-- Opens permissive RLS for the anon key (custom username/password auth).
-- Idempotent: safe to run multiple times.
-- =====================================================================

-- ---------- COMPANIES: ensure expected columns ----------
alter table public.companies add column if not exists company_code text;
alter table public.companies add column if not exists brand        text;
alter table public.companies add column if not exists status       boolean not null default true;

-- ---------- CUSTOMERS: ensure expected columns ----------
alter table public.customers add column if not exists place          text;
alter table public.customers add column if not exists contact_person text;
alter table public.customers add column if not exists contact_number text;
alter table public.customers add column if not exists gst_number     text;
alter table public.customers add column if not exists status         boolean not null default true;

-- ---------- USERS: ensure boolean status, default active=true ----------
do $$
declare v_type text;
begin
  select data_type into v_type from information_schema.columns
   where table_schema='public' and table_name='users' and column_name='status';
  if v_type = 'text' or v_type = 'character varying' then
    alter table public.users add column if not exists status_new boolean;
    update public.users set status_new = (lower(coalesce(status,'active')) = 'active');
    alter table public.users drop column status;
    alter table public.users rename column status_new to status;
  end if;
end $$;
alter table public.users alter column status set default true;
update public.users set status = true where status is null;

-- ---------- ROLES: seeded ----------
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
      execute format('alter table public.%I enable row level security', t);
      execute format(
        'create policy "anon read %1$s"  on public.%1$I for select using (true)', t);
      execute format(
        'create policy "anon write %1$s" on public.%1$I for all using (true) with check (true)', t);
    end if;
  end loop;
end $$;

-- =====================================================================
-- RPCs — boolean-aware
-- =====================================================================
drop function if exists public.set_user_status(uuid, text);
create or replace function public.set_user_status(p_user_id uuid, p_status boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users set status = p_status where id = p_user_id;
end $$;

-- verify_login returns boolean status; only allow active users
create or replace function public.verify_login(
  p_username text,
  p_password text
) returns table (
  id        uuid,
  username  text,
  full_name text,
  role      text,
  region    text,
  status    boolean
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
    and u.status   = true
    and u.password_hash = crypt(p_password, u.password_hash);
end $$;

grant execute on function public.set_user_status(uuid, boolean) to anon, authenticated;
grant execute on function public.create_user(text, text, text, text, text) to anon, authenticated;
grant execute on function public.verify_login(text, text)                  to anon, authenticated;
