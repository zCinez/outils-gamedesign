create table if not exists public.neodium_shared_storage (
  workspace_id text not null default 'global',
  storage_key text not null,
  storage_value text not null default '',
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, storage_key)
);

alter table public.neodium_shared_storage enable row level security;

grant select, insert, update, delete on table public.neodium_shared_storage to anon;
grant select, insert, update, delete on table public.neodium_shared_storage to authenticated;

drop policy if exists "neodium_shared_storage_select_public" on public.neodium_shared_storage;
create policy "neodium_shared_storage_select_public"
on public.neodium_shared_storage
for select
to anon, authenticated
using (true);

drop policy if exists "neodium_shared_storage_insert_public" on public.neodium_shared_storage;
create policy "neodium_shared_storage_insert_public"
on public.neodium_shared_storage
for insert
to anon, authenticated
with check (true);

drop policy if exists "neodium_shared_storage_update_public" on public.neodium_shared_storage;
create policy "neodium_shared_storage_update_public"
on public.neodium_shared_storage
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "neodium_shared_storage_delete_public" on public.neodium_shared_storage;
create policy "neodium_shared_storage_delete_public"
on public.neodium_shared_storage
for delete
to anon, authenticated
using (true);
