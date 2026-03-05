# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) and Cursor IDE (https://cursor.com) when working with code in this repository.

## Commands

```bash
# Development (runs all apps/packages in parallel)
pnpm dev

# Build all packages
pnpm build

# Lint all packages (TypeScript type-check, no ESLint)
pnpm lint

# Database
pnpm db:generate          # Regenerate Prisma client after schema changes
pnpm db:push              # Push schema changes to database
pnpm --filter db db:seed  # Seed RSS feed sources

# Run individual apps
pnpm --filter api dev     # API server on port 3000
pnpm --filter mobile dev  # Expo dev server

# Mobile platform-specific
pnpm --filter mobile ios
pnpm --filter mobile android
```

There are no tests configured yet. Lint is `tsc --noEmit` in each package.

## Architecture

Turborepo + pnpm monorepo with two apps and two shared packages:

```
apps/api         → Hono REST API (Node.js, port 3000)
apps/mobile      → Expo SDK 52 React Native app (expo-router v4)
packages/db      → Prisma ORM client + schema (PostgreSQL on Supabase)
packages/shared  → TypeScript types (Article, MarketCoin) + constants
```

### API (`apps/api`)

Hono server with three route files under `src/routes/` and service layer under `src/services/`.

**Request flow:** Route handler → Service → Prisma → PostgreSQL

**Cron jobs** (`src/cron.ts`) run on server startup:
- Every 15 min: Fetch RSS → deduplicate by URL hash → Gemini rewrite title + 60-word summary → generate blurhash → store Article
- Every 5 min: CoinGecko top 20 coins → upsert MarketCoin

**API endpoints** (all prefixed `/api/v1`):
- `GET /feed?category=all|crypto|ai&cursor=<id>&limit=20` — cursor-based pagination
- `GET /feed/:id` — single article
- `GET /market` — crypto prices ordered by market cap
- `GET /health`

### Mobile (`apps/mobile`)

Expo Router file-based routing with tab navigation:

- `app/(tabs)/index.tsx` — Vertical swipe feed (PagerView, the star feature)
- `app/(tabs)/market.tsx` — Crypto price list
- `app/(tabs)/settings.tsx` — Theme toggle
- `app/article/[id].tsx` — Article detail (modal)

**State:** TanStack Query for server data (`hooks/useFeed.ts`, `hooks/useMarket.ts`), Zustand for local state (`lib/store.ts`: category, theme, read tracking).

**HTTP client:** ky configured in `lib/api-client.ts`, reads `EXPO_PUBLIC_API_URL`.

### Database (`packages/db`)

Prisma schema at `packages/db/prisma/schema.prisma` with 4 models: `Article`, `MarketCoin`, `FeedSource`, and `Category` enum (CRYPTO, AI). PrismaClient singleton exported from `packages/db/src/index.ts`.

Uses two connection URLs: `DATABASE_URL` (connection pooler) and `DIRECT_URL` (direct, for migrations).

### Shared (`packages/shared`)

Types mirror Prisma models for API responses. Key constants: `DEFAULT_PAGE_SIZE=20`, `SUMMARY_WORD_LIMIT=60`, `TITLE_MAX_LENGTH=80`.

## Design System

- **Dark theme (default):** `#030303` background, `#f0f0f0` text, `#E60000` accent (red), `#00D4AA` prediction accent (mint)
- **Light theme:** `#f5f5f5` background, `#111111` text, `#cc0000` accent, `#009977` prediction accent
- **Semantic colors:** `positive` (green), `negative` (red), `textSecondary`, `textMuted`, `textFaint`
- **Fonts:** Anton 400 (display headlines), Inter 300/400/600/700 (body), JetBrains Mono 400/700 (mono/labels)
- **Definitions:** `apps/mobile/constants/theme.ts` and `apps/mobile/constants/typography.ts`

## Environment Variables

See `.env.example`. Required: `DATABASE_URL`, `DIRECT_URL`, `GEMINI_API_KEY`, `COINGECKO_API_URL`, `PORT`. Mobile needs `EXPO_PUBLIC_API_URL`.

## Rules

Source rule files in `.agents/rules/` are canonical. See those files for:
- Clean code standards (clean-code.mdc)
- Conventional Commits format (commit-message-format.mdc)
- PR format (pr-message-format.mdc)
- External context security (prompt-injection-gaurd.mdc)
