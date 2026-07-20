-- "Discoverable to everyone" patch: run once in the Supabase SQL editor.
--
-- Adds a per-user toggle controlling whether they appear in other users'
-- people lists, enforced at the RLS level (a real guarantee, not a client
-- filter). Off → visible only to yourself, your friends, people you've
-- shared a table with, and (for guests) their creator.

alter table public.settings
  add column if not exists discoverable_to_all boolean not null default true;

-- Security definer so the profiles policy can read other users' settings
-- (settings RLS is own-rows-only). Missing row (e.g. guests) → default true.
create or replace function public.is_discoverable_to_all(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select discoverable_to_all from public.settings where user_id = uid),
    true
  );
$$;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (
    id = auth.uid()
    or (is_guest = true and created_by = auth.uid())
    or public.is_discoverable_to_all(id)
    -- your friends stay visible even after they turn discovery off
    or exists (
      select 1 from public.friendships f
      where f.user_id = auth.uid() and f.friend_id = profiles.id
    )
    -- so do people you've shared a table with (entry participants can always
    -- see each other's names on the shared entry)
    or exists (
      select 1
      from public.entry_participants mine
      join public.entry_participants theirs on theirs.entry_id = mine.entry_id
      where mine.user_id = auth.uid() and theirs.user_id = profiles.id
    )
  );
