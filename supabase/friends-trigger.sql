-- Mutual friendship via shared tables: run once in the Supabase SQL editor.
-- Whenever someone is added to a table, they and every other participant
-- become friends of each other (both directions). SECURITY DEFINER because
-- users can only write their own friendship edges directly.

create or replace function public.befriend_table_mates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.friendships (user_id, friend_id)
  select new.user_id, ep.user_id
  from public.entry_participants ep
  where ep.entry_id = new.entry_id and ep.user_id <> new.user_id
  on conflict do nothing;

  insert into public.friendships (user_id, friend_id)
  select ep.user_id, new.user_id
  from public.entry_participants ep
  where ep.entry_id = new.entry_id and ep.user_id <> new.user_id
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_participant_added on public.entry_participants;
create trigger on_participant_added
  after insert on public.entry_participants
  for each row execute function public.befriend_table_mates();

-- Backfill: make all existing table-mates mutual friends too.
insert into public.friendships (user_id, friend_id)
select distinct a.user_id, b.user_id
from public.entry_participants a
join public.entry_participants b on b.entry_id = a.entry_id and b.user_id <> a.user_id
on conflict do nothing;
