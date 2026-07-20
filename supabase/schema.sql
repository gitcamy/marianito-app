-- Marianito MVP schema. Paste into the Supabase SQL editor and Run.
-- Safe to re-run: drops nothing, uses IF NOT EXISTS / ON CONFLICT where possible.

-- ─── Tables ────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text,
  display_name text not null default '',
  username text unique,
  avatar_url text,
  nearby boolean not null default false, -- simulated presence flag for the MVP
  created_at timestamptz not null default now()
);

create table if not exists public.friendships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);

create table if not exists public.blocks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_id)
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  photo_url text not null,
  caption text not null default '',
  location text,
  initiator_id uuid not null references public.profiles(id),
  started_at timestamptz not null,
  is_marianito_hour boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.entry_participants (
  entry_id uuid not null references public.entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (entry_id, user_id)
);

create table if not exists public.entry_appends (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  kind text not null check (kind in ('comment', 'photo')),
  text text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  discoverable_presence boolean not null default true,
  location_consent boolean not null default true,
  notifications_enabled boolean not null default true
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  subject_id uuid references public.profiles(id),
  reason text not null,
  created_at timestamptz not null default now()
);

-- ─── Auto-create profile + settings on sign-up ─────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  insert into public.settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Row-level security ────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.entries enable row level security;
alter table public.entry_participants enable row level security;
alter table public.entry_appends enable row level security;
alter table public.settings enable row level security;
alter table public.reports enable row level security;

-- profiles: everyone signed-in can browse (discoverable people), you edit yours
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid());
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

-- friendships / blocks: you manage your own edges
drop policy if exists "friendships_all_own" on public.friendships;
create policy "friendships_all_own" on public.friendships
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "blocks_all_own" on public.blocks;
create policy "blocks_all_own" on public.blocks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- entries: visible to the initiator and participants; only the initiator inserts.
-- (initiator_id clause is required: at insert time the participants rows don't
-- exist yet, and the entry_participants insert policy looks the entry up.)
drop policy if exists "entries_select_participant" on public.entries;
create policy "entries_select_participant" on public.entries
  for select to authenticated using (
    initiator_id = auth.uid()
    or exists (select 1 from public.entry_participants ep
               where ep.entry_id = id and ep.user_id = auth.uid())
  );
drop policy if exists "entries_insert_initiator" on public.entries;
create policy "entries_insert_initiator" on public.entries
  for insert to authenticated with check (initiator_id = auth.uid());

-- entry_participants: readable by any signed-in user (needed to resolve
-- entry visibility without recursion); only the entry's initiator adds rows
drop policy if exists "participants_select" on public.entry_participants;
create policy "participants_select" on public.entry_participants
  for select to authenticated using (true);
drop policy if exists "participants_insert_initiator" on public.entry_participants;
create policy "participants_insert_initiator" on public.entry_participants
  for insert to authenticated with check (
    exists (select 1 from public.entries e
            where e.id = entry_id and e.initiator_id = auth.uid())
  );

-- appends: participants read; participants write their own
drop policy if exists "appends_select_participant" on public.entry_appends;
create policy "appends_select_participant" on public.entry_appends
  for select to authenticated using (
    exists (select 1 from public.entry_participants ep
            where ep.entry_id = entry_appends.entry_id and ep.user_id = auth.uid())
  );
drop policy if exists "appends_insert_participant" on public.entry_appends;
create policy "appends_insert_participant" on public.entry_appends
  for insert to authenticated with check (
    author_id = auth.uid()
    and exists (select 1 from public.entry_participants ep
                where ep.entry_id = entry_appends.entry_id and ep.user_id = auth.uid())
  );

-- settings: yours only
drop policy if exists "settings_all_own" on public.settings;
create policy "settings_all_own" on public.settings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reports: write-only from the app
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

-- ─── Storage: public photos bucket ─────────────────────────────────────────

insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos_upload_own_folder" on storage.objects;
create policy "photos_upload_own_folder" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "photos_public_read" on storage.objects;
create policy "photos_public_read" on storage.objects
  for select using (bucket_id = 'photos');

-- ─── Demo people (taggable, can't log in) ──────────────────────────────────
-- Lets the "who's here" flow work before real friends join. Delete when done:
--   delete from public.profiles where email like '%@demo.marianito';

insert into public.profiles (id, email, display_name, username, nearby) values
  ('00000000-0000-4000-8000-000000000001', 'ana@demo.marianito',     'Ana Etxeberria',   'ana',     true),
  ('00000000-0000-4000-8000-000000000002', 'mikel@demo.marianito',   'Mikel Aguirre',    'mikel',   true),
  ('00000000-0000-4000-8000-000000000003', 'june@demo.marianito',    'June Ibarra',      'june',    true),
  ('00000000-0000-4000-8000-000000000004', 'leire@demo.marianito',   'Leire Otxoa',      'leire',   false),
  ('00000000-0000-4000-8000-000000000005', 'inigo@demo.marianito',   'Iñigo Zubiri',     'inigo',   false),
  ('00000000-0000-4000-8000-000000000006', 'nerea@demo.marianito',   'Nerea Salaberria', 'nerea',   false),
  ('00000000-0000-4000-8000-000000000007', 'oier@demo.marianito',    'Oier Mendieta',    'oier',    false),
  ('00000000-0000-4000-8000-000000000008', 'maialen@demo.marianito', 'Maialen Urrutia',  'maialen', false)
on conflict (id) do nothing;
