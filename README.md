# The Infinity Bottle

Expo + React Native app for tracking whiskey in an infinity bottle: event-sourced pour log, ABV drift math, blend genealogy, and Gemini-powered flavor prediction.

## Phase Status
- Phase 0: Scaffold ✅
- Phase 1: DB Schema + Tab Scaffold ✅
- Phase 2: Catalog + Barcode + Cache ✅ (`PHASE_2_COMPLETE.md`)
- Phase 3: Local persistence + interactive bottle catalog ✅
- Phase 3 next: Catalog lookup, barcode scanning, and UI polish ⏳
- Phase 4: Dev build / Google Sign-In / Drive backup ⏳
- Phase 5: Gemini prediction + radar chart ⏳
- Phase 6: Photos, share cards, scientific ABV ⏳

## Run
```bash
npm install
npm run typecheck   # strict TypeScript
npm test             # 49 domain tests, 100% pass required
npm run db:generate  # generate migrations after changing src/db/schema.ts
```

The Expo root layout applies bundled Drizzle migrations before rendering the
navigation stack. The SQLite database is `the-infinity.db`; the event log is
the source of truth and derived projections are cache data. Bottles can be
created, edited, deleted, selected for additions, and tracked by remaining
volume. Selected bottle ABV is used automatically, while manual ABV entry
remains available.

## Stack
- Expo + TypeScript + Expo Router
- `expo-sqlite` + Drizzle ORM (local-first, offline)
- NativeWind (Tailwind) + Zustand + TanStack Query
- `victory-native` charts (ABV drift + flavor radar)
- `@shopify/react-native-skia` bottle graphic
- Vitest (domain layer only) — `src/domain/` imports nothing (pure functions)

## Design Notes
- All numbers are integers: volume in ml, ABV in basis points (1 bp = 0.01%).
- `units = volumeMl × abvBp` (pure alcohol).
- `fold()` is the source of truth; stored projections are denormalized cache.
- BYOK Gemini (no proxy); never log the key.
- See `CLAUDE.md` for architecture conventions.

## Repo
`https://github.com/not-rajkumar/the-infinity`
V2 dependency fixes — React/Tailwind conflicts — see SESSION_CHANGES.md § V2 Dependency Problems.
Catalog-to-pour integration is complete in `38d210e`. Next: implement real
catalog lookup and barcode camera scanning, then add the ABV drift chart and
remaining UI polish. Domain: 49/49 pass.
