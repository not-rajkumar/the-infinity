# Copilot instructions

## Commands

Install dependencies with `npm install`.

- Type-check the project: `npm run typecheck`
- Run the domain test suite: `npm test`
- Run tests in watch mode: `npm run test:watch`
- Run one test file: `npx vitest run src/domain/__tests__/abv.test.ts`
- Run one test by name: `npx vitest run src/domain/__tests__/fold.test.ts -t "clamps"`
- Generate a Drizzle migration after changing `src/db/schema.ts`: `npm run db:generate`
- Start the Expo development server: `npx expo start`

The package does not currently define a separate lint or production build script.

## Current status and next task

The domain math, SQLite/Drizzle schema, initial migration, catalog/barcode parsing, cache, Zustand scaffolding, and Expo tab scaffold are present. The initial migration is bundled in `src/db/migrations/index.ts` and runs from `app/_layout.tsx` before the router renders. Strict typecheck and all 49 domain tests pass.

The next implementation task is persistence integration: connect the in-memory Zustand blend/event stores to Drizzle, implement append-only blend/bottle/event CRUD, load the active blend and event log on startup, and wire the Blend, Log, and Catalog tabs to the stores. Preserve `fold()` as the source of truth; database projections remain cache data. After changing `src/db/schema.ts`, run `npm run db:generate` and update the bundled migration export in `src/db/migrations/index.ts`.

## Architecture

This is an Expo/React Native app using Expo Router, with Android as the primary target and iOS as a secondary target. The root router is `app/_layout.tsx`; the tab screens and tab layout live under `src/app/(tabs)`.

The app is local-first and offline-capable. Drizzle wraps the `expo-sqlite` database in `src/db/index.ts`, with tables defined in `src/db/schema.ts`. The data model is `blends -> bottles -> blend_events`; `predictions`, `tastings`, `catalog_cache`, and `meta` are read-side/supporting tables. The SQLite database is the source of persistence, but the event log is the source of truth for a blend's current contents.

Database migrations are generated from `src/db/schema.ts` using `drizzle.config.ts` and `npm run db:generate`. Expo consumes the generated SQL through the typed migration bundle in `src/db/migrations/index.ts`; the root layout runs `useMigrations` before displaying the navigation stack. Do not create or open a second database singleton, and do not render screens that query the database before migration succeeds.

The domain layer in `src/domain` contains the blend math and event folding. It must stay independent of React Native, Expo, SQLite/Drizzle, network clients, and UI state so it remains deterministic and fast to test. `fold()` orders events, derives the current state and per-event projections, and reports malformed data as `FoldProblem`s instead of throwing. `src/hooks`, `src/store`, and UI components consume those domain functions; Zustand stores currently keep the active blend/events and derived fold result in memory.

Catalog functionality is split between input parsing (`src/catalog/parse.ts`), the SQLite-backed TTL/size-bounded cache (`src/catalog/cache.ts`), and external lookup stubs (`src/catalog/lookup.ts`). Barcode normalization is in `src/barcode/scan.ts`. The catalog lookup layer is intentionally replaceable as external providers are added.

## Key conventions

- Keep all stored numeric quantities integral: volume is millilitres, ABV is basis points (`4200` means `42.00%`), and `units = volumeMl * abvBp`. Do not introduce floating-point storage or change these units.
- Use `add(state, volumeMl, sourceAbvBp)` for additions. For removals, use `remove(state, volumeMl)`: alcohol is removed at the blend's current ABV, not the source bottle's ABV.
- Treat `fold(events)` as authoritative. Stored event projections (`abvBp` on an event and cached projection rows) are denormalized data and must be recomputed/validated against a fresh fold with `projectionsMatch()`.
- Events are append-only. Do not update an existing pour to correct history; append a compensating event. Event ordering is deterministic: `occurredAt`, then `createdAt`, then `id`.
- `fold()` is deliberately tolerant of bad logs: it skips invalid additions, records missing ABV, and clamps removals that exceed available volume. Preserve this non-throwing behavior and its problem codes when changing the fold.
- `BlendEvent.volumeMl` is always a positive magnitude; `kind` (`ADD` or `REMOVE`) supplies the direction. ADD events require `abvBp`; REMOVE events use `abvBp` only as a projection and may have `null` when the blend was empty.
- User-entered volume and ABV must go through `parseVolumeMl` and `parseAbvBp`. These parsers return `null` for invalid input; callers should show validation rather than guessing.
- Use the existing conversion constants: `ML_PER_OZ = 29.5735295625`, `ML_PER_CL = 10`, and `ML_PER_SHOT = 44`.
- Keep domain tests in `src/domain/__tests__`. They exercise pure functions only; avoid importing UI, database, Expo, or network code into the domain.
- Catalog cache entries expire after seven days and the cache is capped at 200 records. Preserve both TTL and oldest-entry eviction behavior when changing cache access.
- Gemini is a BYOK enhancement, not a prerequisite for core app behavior. Store keys only in `expo-secure-store`, never log them, and keep prediction failures from blocking manual blend tracking.
- Follow the existing NativeWind styling approach in React Native components and Expo Router file-based routing rather than introducing a separate navigation or styling system.
