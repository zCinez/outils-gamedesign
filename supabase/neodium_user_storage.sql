create table if not exists public.neodium_shared_storage (
  workspace_id text not null default 'global',
  storage_key text not null,
  storage_value text not null default '',
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, storage_key)
);

create table if not exists public.neodium_allowed_emails (
  email text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

create schema if not exists app_private;

create or replace function app_private.is_allowed_email()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.neodium_allowed_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.neodium_shared_storage enable row level security;
alter table public.neodium_allowed_emails enable row level security;

grant select, insert, update, delete on table public.neodium_shared_storage to authenticated;
grant select on table public.neodium_allowed_emails to authenticated;

drop policy if exists "neodium_shared_storage_select_public" on public.neodium_shared_storage;
create policy "neodium_shared_storage_select_allowed"
on public.neodium_shared_storage
for select
to authenticated
using ((select app_private.is_allowed_email()));

drop policy if exists "neodium_shared_storage_insert_public" on public.neodium_shared_storage;
create policy "neodium_shared_storage_insert_allowed"
on public.neodium_shared_storage
for insert
to authenticated
with check ((select app_private.is_allowed_email()));

drop policy if exists "neodium_shared_storage_update_public" on public.neodium_shared_storage;
create policy "neodium_shared_storage_update_allowed"
on public.neodium_shared_storage
for update
to authenticated
using ((select app_private.is_allowed_email()))
with check ((select app_private.is_allowed_email()));

drop policy if exists "neodium_shared_storage_delete_public" on public.neodium_shared_storage;
create policy "neodium_shared_storage_delete_allowed"
on public.neodium_shared_storage
for delete
to authenticated
using ((select app_private.is_allowed_email()));

drop policy if exists "neodium_allowed_emails_select_authenticated" on public.neodium_allowed_emails;
create policy "neodium_allowed_emails_select_authenticated"
on public.neodium_allowed_emails
for select
to authenticated
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

insert into public.neodium_allowed_emails (email)
values
  ('samgiant1007@gmail.com')
on conflict (email) do nothing;
