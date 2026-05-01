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
- **Storage**: AsyncStorage (no backend — all data is local/static)
- **Features**:
  - Home Dashboard: Next prayer countdown, Hijri date, Verse of the Day, Quick Actions
  - Quran: 114 Surahs list, search, bookmarks, Juz view, per-surah verse reader with adjustable font
  - Prayer Times: Calculated locally (pure JS algorithm), 5 daily prayers, prayer log tracker, Qibla compass
  - Dhikr/Tasbih: Counter with 33/100/1000 targets, dhikr sets (morning/evening), 99 Names counter
  - Duas: Categorized duas library with search and bookmarks
  - Hadith: Local embedded database (57 authentic hadiths from Bukhari, Muslim, Abu Dawud, Tirmidhi, Nawawi 40, Riyad as-Salihin); no external API required — browse by collection, full-text search, tap-to-expand detail modal with share
  - 99 Names of Allah: Full list with meanings, modal detail view, dhikr counter
  - Zakat Calculator: Cash, gold, silver, investments, debts — full nisab check and zakat due
  - Hajj & Umrah Guide: Step-by-step guides, tawaf/sa'i counters, key duas
  - Islamic Calendar: Hijri/Gregorian dual calendar, Islamic events, Gregorian converter
  - Prayer Tracker: 30-day heatmap, streak counter, completion rate bars
  - Settings: Calculation method, madhab, notifications, font size, dark/light/system theme
- **Screens**: `app/(tabs)/` (Home, Quran, Prayer, Dhikr, More) + modal screens (qibla, duas, hadith, zakat, hajj, calendar, names, settings, prayer-tracker, quran/[surahId])

### API Server
- **Path**: `artifacts/api-server`
- **Kind**: Express API server
- **Proxy routes**: `/api/hadith/*` → sunnah.com (with API key); `/api/quran/*` → alquran.cloud
- **Purpose**: Avoids CORS restrictions when calling Islamic APIs from the browser

## Architecture Notes
- **Hadith data**: Fully local (57 hadiths in `data/hadiths.ts`) — no external API dependency. sunnah.com key is invalid; proxy exists for future use.
- **Quran data**: Live from alquran.cloud API (no key required, CORS-friendly). Responses cached in AsyncStorage.
- **Prayer times**: Computed locally via `adhan` library using device GPS or manually selected city coordinates.
- **Timezone**: `LocationInfo.timezone` (IANA string) drives all time formatting. Stored locations without timezone are backfilled via CITIES lookup.

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
