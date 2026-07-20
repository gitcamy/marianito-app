# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Marianito

A small private social app for shared aperitif "table" moments. Spec lives on the
FigJam board: https://www.figma.com/board/5h7KjnjmbXJ5gRqgBnSYnO ("MVP User Journey" + "Visual Identity").

## Running

- `npx expo start --web` — full app runs offline in the browser (all data mocked).
- `npx expo start --ios` — needs Xcode/iOS Simulator or Expo Go on a device.
- `npx tsc --noEmit` — type-check.

## Architecture

Expo SDK 57 + expo-router (routes in `src/app/`, thin files only) + zustand + TypeScript.

- **Route files contain zero logic** — each renders a component from `src/screens/`.
- **Mock-first, Supabase-ready**: UI → stores (`src/stores/`) → service interfaces
  (`src/services/types.ts`). `src/services/index.ts` is the swap point — the only file that
  changes when Supabase replaces the mocks in `src/services/mock/` (AsyncStorage-backed,
  seeded from `src/mocks/seed.ts`).
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
