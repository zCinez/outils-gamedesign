create table if not exists public.neodium_user_storage (
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_key text not null,
  storage_value text not null default '',
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, storage_key)
);

alter table public.neodium_user_storage enable row level security;

drop policy if exists "neodium_user_storage_select_own" on public.neodium_user_storage;
create policy "neodium_user_storage_select_own"
on public.neodium_user_storage
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "neodium_user_storage_insert_own" on public.neodium_user_storage;
create policy "neodium_user_storage_insert_own"
on public.neodium_user_storage
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "neodium_user_storage_update_own" on public.neodium_user_storage;
create policy "neodium_user_storage_update_own"
on public.neodium_user_storage
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "neodium_user_storage_delete_own" on public.neodium_user_storage;
create policy "neodium_user_storage_delete_own"
on public.neodium_user_storage
for delete
to authenticated
using (auth.uid() = user_id);
