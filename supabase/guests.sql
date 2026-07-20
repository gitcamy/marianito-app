-- Guest friends patch: run once in the Supabase SQL editor (after schema.sql).
-- A guest is a profile with no auth account, owned by the user who created it.

alter table public.profiles add column if not exists is_guest boolean not null default false;
alter table public.profiles add column if not exists created_by uuid references public.profiles(id);

-- Allow inserting your own guests (plus the existing own-profile case).
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (
    id = auth.uid()
    or (is_guest = true and created_by = auth.uid())
  );

-- Let the creator rename their guests later if needed.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (
    id = auth.uid()
    or (is_guest = true and created_by = auth.uid())
  );
