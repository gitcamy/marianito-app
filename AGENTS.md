# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Marianito

A small private social app for shared aperitif "table" moments. Spec lives on the
FigJam board: https://www.figma.com/board/5h7KjnjmbXJ5gRqgBnSYnO ("MVP User Journey" + "Visual Identity").

## Running

- `npx expo start --web` — full app runs offline in the browser (all data mocked).
- `npx expo start --ios` — needs Xcode/iOS Simulator or Expo Go on a device.
- `npx tsc --noEmit` — type-check.
- `npm test` — jest unit tests (domain logic, mock services, stores; `__tests__/` folders).
  AsyncStorage and expo-crypto are mocked in `jest-setup.js`.

## Architecture

Expo SDK 57 + expo-router (routes in `src/app/`, thin files only) + zustand + TypeScript.

- **Route files contain zero logic** — each renders a component from `src/screens/`.
- **Dual backend**: UI → stores (`src/stores/`) → service interfaces (`src/services/types.ts`).
  `src/services/index.ts` picks the implementation at startup: with
  `EXPO_PUBLIC_SUPABASE_URL`/`_ANON_KEY` set in `.env` it uses the Supabase services
  (`src/services/supabase/`); without them it falls back to the AsyncStorage mocks
  (`src/services/mock/`, seeded from `src/mocks/seed.ts`). Restart `expo start` after
  changing `.env` — env vars are inlined at bundle time.
- **Auth is passwordless**: email OTP ("magic code") via `signInWithOtp`/`verifyOtp` — one
  flow for sign-up and sign-in. The Supabase "Magic Link" email template must contain
  `{{ .Token }}` so the email carries the 6-digit code. Backend schema + RLS live in
  `supabase/schema.sql`; incremental patches (e.g. `supabase/guests.sql`) are separate files —
  run each once in the SQL editor.
- **Guest friends**: profiles with `is_guest = true` and `created_by = <owner>` — no auth
  account, taggable at tables, visible in search only to their creator. Created from the
  Who's Here screen ("Add ‘name’ as a guest").
- **Discoverability** (`supabase/discoverable.sql`): the "Discoverable to everyone" setting
  (`settings.discoverable_to_all`, default true) is enforced in the `profiles` SELECT RLS
  policy via the security-definer `is_discoverable_to_all()` — off means only the user
  themself, their friends, table-mates, and (for guests) their creator can see the profile.
- **Geo-presence** (`supabase/presence.sql`): foreground-only location pings
  (`usePresencePing`, gated on BOTH privacy toggles) into a `presence` table readable only
  by its owner. Nearby-ness comes exclusively from the `nearby_friend_ids()` RPC — friends
  within ~500 m with fresh (<45 min) pings and both toggles on; it returns ids, NEVER
  coordinates. Client merges those ids into `Friend.isNearby` (static `profiles.nearby`
  stays as a demo override). Revoking either toggle deletes the presence row.
- `EXPO_PUBLIC_USE_MOCKS=1 npx expo start` forces the offline mock backend even when `.env`
  has Supabase credentials (demo mode / UI testing).
- The mock current user always has id `'me'` (`ME_ID`) so seed data can reference them.
- Seed entry photos use `seed:<tone>` URIs rendered as offline tile-flower placeholders by
  `EntryPhoto`; real picks use device URIs.
- Theme tokens in `src/theme/` — no raw hexes in screens. Display font: Fraunces (stand-in
  for the Basque "Koba"-style brand font).

## Domain rules

- A table needs ≥2 people (initiator + ≥1 tagged) before the moment can be posted.
- `TableDraft.openedAt` is captured when "+ Open a table" is tapped; an entry is
  "Marianito Hour" (E2) iff that hour is 13 device-local (`src/utils/marianitoHour.ts`),
  computed once at creation and stored.
- Co-authors are auto-added to the friend list on post (`ensureFriends`).
- The journal lists every entry where the user is a participant (D1); "nearby" is a
  simulated boolean on mock friends, gated by the Discoverable presence setting (G1).
- Sign-out clears only the session key; journal/friends/settings persist.

## Gotchas

- `Alert.alert` is a no-op on react-native-web — use `confirmAction`/`notify` from
  `src/utils/confirm.ts`.
- Always pick photos through `pickPhoto()` in `src/utils/pickPhoto.ts` — it returns a URI that
  survives restarts (base64 `data:` URI on web, a copy in the document directory on native).
  Raw picker URIs are temporary (`blob:` on web, purgeable cache files on iOS) and go blank
  later; `EntryPhoto` renders a placeholder tile for any photo that fails to load.
- `__DEV__`: long-press the Home header title to open a table at 13:30 for demoing the E2 badge.
