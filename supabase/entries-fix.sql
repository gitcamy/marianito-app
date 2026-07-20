-- Fix: initiators must always see their own entries. Without this, the
-- participants insert (which verifies entry ownership) can't see the freshly
-- created entry — its participants don't exist yet — and posting fails with
-- an RLS violation on entry_participants. Run once in the SQL editor.

drop policy if exists "entries_select_participant" on public.entries;
create policy "entries_select_participant" on public.entries
  for select to authenticated using (
    initiator_id = auth.uid()
    or exists (select 1 from public.entry_participants ep
               where ep.entry_id = id and ep.user_id = auth.uid())
  );
