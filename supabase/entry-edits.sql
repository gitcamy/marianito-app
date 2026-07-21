-- Entry edits / soft-delete / leave-table patch.
-- Run once in the Supabase SQL editor (after schema.sql).
--
-- - entry_hides: per-user soft delete — hide from YOUR journal only
-- - participants can leave (delete own row)
-- - participants can update entry caption/photo/location
-- - append authors can update/delete their own comments & photos

create table if not exists public.entry_hides (
  entry_id uuid not null references public.entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, user_id)
);

alter table public.entry_hides enable row level security;

drop policy if exists "hides_all_own" on public.entry_hides;
create policy "hides_all_own" on public.entry_hides
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      exists (select 1 from public.entry_participants ep
              where ep.entry_id = entry_hides.entry_id and ep.user_id = auth.uid())
      or exists (select 1 from public.entries e
                 where e.id = entry_hides.entry_id and e.initiator_id = auth.uid())
    )
  );

-- Participants may update co-authored moments (caption / photo / location).
drop policy if exists "entries_update_participant" on public.entries;
create policy "entries_update_participant" on public.entries
  for update to authenticated using (
    exists (select 1 from public.entry_participants ep
            where ep.entry_id = id and ep.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.entry_participants ep
            where ep.entry_id = id and ep.user_id = auth.uid())
  );

-- Anyone can remove themselves from a table they were tagged in.
drop policy if exists "participants_delete_own" on public.entry_participants;
create policy "participants_delete_own" on public.entry_participants
  for delete to authenticated using (user_id = auth.uid());

-- Authors can edit / delete their own appends.
drop policy if exists "appends_update_own" on public.entry_appends;
create policy "appends_update_own" on public.entry_appends
  for update to authenticated using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "appends_delete_own" on public.entry_appends;
create policy "appends_delete_own" on public.entry_appends
  for delete to authenticated using (author_id = auth.uid());
