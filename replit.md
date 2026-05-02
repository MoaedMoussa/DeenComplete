# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

### Deen Complete (Mobile App)
- **Path**: `artifacts/deen-complete`
- **Kind**: Expo / React Native mobile app
- **Purpose**: Comprehensive all-in-one Islamic companion app
- **Color Palette**: Deep forest green (#1A5C3A), gold (#C8973A), cream (#FAFAF5)
- **Fonts**: Inter (UI), Amiri (Arabic text via `@expo-google-fonts/amiri`)
- **Storage**: AsyncStorage (no backend — all data is local/static + external APIs)

### Features & API Sources

| Feature | API / Source |
|---|---|
| Prayer Times | aladhan.com API (primary) + adhan library (fallback) |
| Qibla Direction | aladhan.com API (primary) + local spherical trig (fallback) |
| Quran Reader | alquran.cloud API (page-by-page, cached in AsyncStorage) |
| Hadith Library | Local embedded DB (57 hadiths across 6 collections) |
| 99 Names | Local data (`data/names.ts`) |
| Dhikr / Tasbih | Local data (`data/dhikr.ts`) |
| Duas | Local data (`data/duas.ts`) |
| Islamic Calendar | Local Hijri algorithm + `data/calendar.ts` events |
| Hajj & Umrah | Local guide (`data/hajj.ts`) |
| Zakat Calculator | Coinbase API for live gold/silver spot prices |
| Prayer Tracker | Local AsyncStorage (30-day heatmap, streaks) |
| Location Detection | GPS (device) → ipapi.co → ip-api.com → freeipapi.com → timezone city match → Makkah fallback |

### Screens
- `app/(tabs)/` — Home, Quran, Prayer, Dhikr, More (tab bar)
- `app/` — qibla, duas, hadith, zakat, hajj, calendar, names, settings, prayer-tracker, quran/[surahId]

### API Integration Notes
- **aladhan.com** (prayer times + qibla): No API key required. `fetchPrayerTimesFromAladhan()` and `fetchQiblaFromAladhan()` in `data/prayers.ts`
- **alquran.cloud** (Quran): No API key required. Fetches by page number (1-604), caches in AsyncStorage. Two concurrent requests (Arabic + translation edition)
- **Coinbase** (metal prices): `GET /v2/prices/XAU-USD/spot` and `XAG-USD/spot`. No key required. Nisab calculated from live prices
- **IP geolocation**: Three-service waterfall with 6s AbortController timeouts each
- **Timezone-aware prayer times**: API returns local time strings ("HH:MM") converted to JS Date via `parseAladhanTime()` using IANA timezone offset math
- **Compass**: `useNativeDriver: false` required for JS-driven rotation interpolation (web compatibility)

### Architecture Notes
- `contexts/AppContext.tsx`: Central state — location, prayer times, settings, logs, dhikr counts, bookmarks
- `data/prayers.ts`: All prayer-related exports (API + local) + `CALCULATION_METHODS`, `DEFAULT_PRAYER_TIMES`, `getHijriDate`, `getQiblaDirection`, `getDistanceToMakkah`, `formatTime`, `formatCountdown`
- `data/hadiths.ts`: Uses `LocalHadith` interface with `english` field (NOT `text`), `grades` array (NOT `grade`)
- `data/hadith.ts` (singular): Different interface with `text` field — used by `getDailyHadith()` on home screen only
- `hooks/useColors.ts`: `primary` (#1A5C3A), `accent`/`gold` (#C8973A), `goldLight`, `muted`, `mutedForeground`, `card`, `border`, `foreground`, `background`

### Known Pre-existing TypeScript Warnings (non-blocking)
- `app/qibla.tsx`: Cannot find module `expo-sensors` (dynamic import type issue)
- `hooks/useColors.ts`: Type cast overlap warning on color theme record

### API Server
- **Path**: `artifacts/api-server`
- **Kind**: Express API server
- **Proxy routes**: `/api/hadith/*` → sunnah.com (with API key); `/api/quran/*` → alquran.cloud
- **Purpose**: Avoids CORS restrictions when calling Islamic APIs from the browser (currently unused by the mobile app which calls APIs directly)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
