-- Geo-presence patch: run once in the Supabase SQL editor (after schema.sql).
--
-- Privacy model: raw coordinates are readable ONLY by their owner (RLS).
-- Other users learn nearby-ness exclusively through nearby_user_ids(), which
-- returns ids — never locations — and only for people who have BOTH privacy
-- toggles on and a fresh ping. Anyone with "Discoverable presence" off never
-- appears; anyone with "Discoverable to everyone" off resolves to no profile
-- for strangers (profiles RLS), so they stay invisible to non-friends.

create table if not exists public.presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);

alter table public.presence enable row level security;

drop policy if exists "presence_own" on public.presence;
create policy "presence_own" on public.presence
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Anyone (friend or not) within radius_m of the caller's last ping, both pings
-- fresh (< 45 min), target has discoverable_presence AND location_consent.
-- SECURITY DEFINER so it can read presence rows — but it only returns ids.
-- Distance = haversine (meters); no PostGIS needed at this scale.
drop function if exists public.nearby_friend_ids(integer);
create or replace function public.nearby_user_ids(radius_m integer default 500)
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  with me as (
    select lat, lng from public.presence
    where user_id = auth.uid()
      and updated_at > now() - interval '45 minutes'
  )
  select p.user_id
  from public.presence p
  cross join me
  join public.settings s
    on s.user_id = p.user_id
   and s.discoverable_presence
   and s.location_consent
  where p.user_id <> auth.uid()
    and p.updated_at > now() - interval '45 minutes'
    and 2 * 6371000 * asin(sqrt(
          power(sin(radians(p.lat - me.lat) / 2), 2)
          + cos(radians(me.lat)) * cos(radians(p.lat))
          * power(sin(radians(p.lng - me.lng) / 2), 2)
        )) <= radius_m;
$$;
