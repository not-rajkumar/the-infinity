# The Infinity Bottle

The Infinity Bottle is an offline-capable Expo application for tracking a
whiskey infinity bottle. It records additions and pours, calculates current
volume and ABV, maintains a source-bottle catalog, and displays ABV drift over
time.

## Current status

The current V1 implementation includes:

- Local SQLite persistence with Drizzle migrations.
- Blend creation and active-blend hydration at startup.
- Append-only addition and removal event logging.
- Integer-based volume and ABV calculations.
- Current blend volume and ABV derived from the event log.
- Fold-problem reporting for malformed or over-sized events.
- Bottle catalog creation, editing, deletion, and validation.
- Bottle remaining-volume tracking when a catalog bottle is used.
- Manual bottle entry with optional barcode, ABV, volume, and metadata.
- Barcode normalization and Expo Camera scanning.
- Open Food Facts barcode lookup and bottle-name search.
- Seven-day catalog caching with a 200-entry size limit.
- Lookup- and scan-prefilled bottle creation with manual fallback.
- Projection-backed ABV drift chart.
- Blend and event timeline empty, validation, loading, and error states.
- Android release-build workflow for GitHub Actions.

The project currently has 53 automated tests, and strict TypeScript checking
passes.

## Core functionality

### Blend tracking

Create an active blend and record whiskey additions or pours. Additions can use
the ABV from a selected catalog bottle or accept a manually entered ABV.
Removals use the blend's current ABV, preserving the historical alcohol
calculation. Vessel capacity and tracked source-bottle volume are validated
before an addition is saved.

### Event log and calculations

The event log is persisted in SQLite and folded into the current blend state.
Volume is stored in millilitres and ABV in basis points, where `4600` means
`46.00%`. The ABV drift chart and timeline use the projections produced by the
same fold operation.

### Bottle catalog

Catalog bottles can be entered manually or created from a barcode scan or
provider lookup. Lookup results prefill the manual form so users can correct
or complete missing data. Catalog entries track nominal volume, remaining
volume, ABV, barcode, source metadata, and optional provider imagery.

### Offline catalog behavior

Barcode results are cached locally for seven days. The cache stores at most
200 entries and removes the oldest records when the limit is exceeded.
Manual entry remains available when the device is offline or a provider has
no result.

## Technology stack

- **Framework:** Expo SDK 57, React Native, TypeScript, and Expo Router
- **Persistence:** `expo-sqlite` with Drizzle ORM and bundled migrations
- **State:** Zustand
- **Styling:** NativeWind and Tailwind CSS
- **Charts:** `victory-native`
- **Native graphics:** `@shopify/react-native-skia`
- **Barcode scanning:** `expo-camera`
- **Catalog provider:** Open Food Facts
- **Testing:** Vitest
- **Android release:** GitHub Actions with Expo Prebuild and Gradle

## Development commands

Install dependencies:

```bash
npm ci --legacy-peer-deps
```

Run strict typechecking:

```bash
npm run typecheck
```

Run the test suite:

```bash
npm test
```

Generate a Drizzle migration after changing `src/db/schema.ts`:

```bash
npm run db:generate
```

Start Expo:

```bash
npx expo start
```

Run Expo diagnostics:

```bash
npx expo-doctor
```

## Android release

The workflow at `.github/workflows/android-release.yml` can be dispatched
manually from GitHub Actions. It installs dependencies, generates the Android
project with Expo Prebuild, assembles a release APK, and attaches the APK to a
GitHub release.

The repository does not commit the generated `android/` directory. Local
Android builds require Android SDK configuration through `ANDROID_HOME`,
`ANDROID_SDK_ROOT`, or `android/local.properties`.

## Repository

https://github.com/not-rajkumar/the-infinity
