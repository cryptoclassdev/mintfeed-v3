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

# Test (vitest for API, jest for mobile)
pnpm test
pnpm --filter api test          # API tests (vitest)
pnpm --filter api test:watch    # API tests in watch mode
pnpm --filter mobile test       # Mobile tests (jest)

# Database
pnpm db:generate          # Regenerate Prisma client after schema changes
pnpm db:push              # Push schema changes to database
pnpm --filter db db:seed  # Seed RSS feed sources

# Run individual apps
pnpm --filter api dev     # API server on port 3000
pnpm --filter mobile dev  # Expo dev server
pnpm --filter web dev     # Next.js web app on port 3001

# Mobile platform-specific
pnpm --filter mobile ios
pnpm --filter mobile android
```

Lint is `tsc --noEmit` in each package.

## Architecture

Turborepo + pnpm monorepo:

```
apps/api         → Hono REST API (Node.js, port 3000)
apps/mobile      → Expo SDK 52 React Native app (expo-router v4)
apps/web         → Next.js 15 marketing site (React 19, Tailwind, Three.js, GSAP)
packages/db      → Prisma ORM client + schema (PostgreSQL on Supabase)
packages/shared  → TypeScript types + Zod schemas + constants
```

### API (`apps/api`)

Hono server with route files under `src/routes/`, service layer under `src/services/`, and middleware under `src/middleware/`.

**Request flow:** Route handler → Service → Prisma → PostgreSQL

**Middleware:**
- `rate-limit.ts` — Per-route rate limiting (100 req/min global, 10/min for transactions, 20/min for orders)
- `url-validator.ts` — External API URL validation

**Auth pattern:** `ADMIN_SECRET` env var, validated via `Bearer {ADMIN_SECRET}` header for admin endpoints.

**Cron jobs** (`src/cron.ts`) run on server startup:
- Every 15 min: RSS fetch → deduplicate → Gemini rewrite title + summary → blurhash → store Article
- Every 15 min (staggered +7 min): Twitter/X fetch via `processTwitterItems()`
- Every 5 min: CoinGecko top 20 coins → upsert MarketCoin
- Every 5 min: Jupiter prediction market price refresh
- Every 30 min: Backfill unmatched article↔market links
- Hourly: Clean up old price snapshots + process Expo push receipts

**API endpoints** (all prefixed `/api/v1`):

Feed & Market:
- `GET /feed?category=all|crypto|ai&cursor=<id>&limit=20` — cursor-based pagination
- `GET /feed/:id` — single article
- `GET /market` — crypto prices ordered by market cap
- `GET /health`

Prediction Markets:
- `GET /predictions/markets/:marketId` — market details from Jupiter
- `GET /predictions/orderbook/:marketId` — order book
- `GET /predictions/trading-status` — trading status check
- `POST /predictions/orders` — create order (Zod-validated via `CreateOrderSchema`)
- `GET /predictions/orders` — user orders by wallet
- `POST /predictions/transactions/submit` — submit signed Solana transaction
- `GET /predictions/positions` — user positions by wallet
- `DELETE /predictions/positions/:positionPubkey` — close position
- `DELETE /predictions/positions` — close all positions
- `POST /predictions/positions/:positionPubkey/claim` — claim winnings
- `GET /predictions/live` — live markets from DB

Notifications:
- `POST /notifications/register` — register push device
- `PUT /notifications/preferences` — update notification preferences
- `GET /notifications/preferences` — get notification preferences
- `GET /notifications/debug` — list devices + logs (staging only, admin)
- `POST /notifications/test` — send test notification (staging only, admin)

Solana Integrations:
- `POST /skr/resolve-domain` — resolve .skr domain to wallet address
- `POST /skr/resolve-address` — reverse lookup address to .skr domain
- `POST /seeker/verify` — verify Seeker Genesis Token ownership

### Mobile (`apps/mobile`)

Expo Router file-based routing with tab navigation:

- `app/(tabs)/index.tsx` — Vertical swipe feed (PagerView, the star feature)
- `app/(tabs)/market.tsx` — Crypto price list
- `app/(tabs)/settings.tsx` — Theme toggle
- `app/article/[id].tsx` — Article detail (modal)
- `app/market-sheet/[id].tsx` — Market detail bottom sheet

**State:** TanStack Query for server data, Zustand for local state (`lib/store.ts`: category, theme, read tracking).

**Key hooks** (`hooks/`):
- `useFeed.ts`, `useMarket.ts` — Core feed/market data
- `usePredictionMarket.ts`, `usePredictionOrders.ts`, `usePredictionPositions.ts` — Prediction market data
- `usePredictionTrading.ts` — Place/close/claim trades (Solana wallet interaction)
- `useSwipeBet.ts` — Swipe-based betting UI logic
- `useWalletBalance.ts` — Wallet balance fetching
- `useLiveMarketPrice.ts` — Real-time price updates
- `useFearGreed.ts` — Crypto fear/greed index
- `useNotifications.ts` — Push notification registration + Android channels
- `useNotificationPreferences.ts` — Notification settings
- `useSeekerVerification.ts` — Seeker device verification
- `useSkrDomain.ts` — .skr domain resolution

**HTTP client:** ky configured in `lib/api-client.ts`, reads `EXPO_PUBLIC_API_URL`.

### Database (`packages/db`)

Prisma schema at `packages/db/prisma/schema.prisma`. PrismaClient singleton exported from `packages/db/src/index.ts`.

Uses two connection URLs: `DATABASE_URL` (connection pooler) and `DIRECT_URL` (direct, for migrations).

**Models:**
- `Article` — News articles (RSS + Twitter sources, with dedup hashes)
- `MarketCoin` — CoinGecko top-20 crypto prices
- `PredictionMarket` — Jupiter prediction market data (question, outcomes, prices, liquidity, volume)
- `ArticlePredictionMarket` — Join table linking articles to prediction markets
- `FeedSource` — RSS feed source URLs
- `TwitterSource` — Twitter/X sources with tiers (TIER_1 always show, TIER_2 engagement threshold, TIER_3 background)
- `PushDevice` — Registered Expo push devices
- `NotificationPreference` — Per-device notification settings
- `NotificationLog` — Sent notification history (for dedup + throttling)
- `CoinPriceSnapshot` — Historical coin price tracking

**Enums:** `Category` (CRYPTO, AI), `SourceType` (RSS, TWITTER), `TwitterSourceTier` (TIER_1/2/3), `NotificationType` (MARKET_MOVER, BREAKING_NEWS, PREDICTION_SETTLED)

### Shared (`packages/shared`)

Types mirror Prisma models for API responses. Zod schemas for request validation (e.g., `CreateOrderSchema`, `ClosePositionSchema`, `ClaimPositionSchema`). Key constants: `DEFAULT_PAGE_SIZE=20`, `SUMMARY_WORD_LIMIT=60`, `TITLE_MAX_LENGTH=80`, `USDC_MINT`.

## Design System

- **Dark theme (default):** `#030303` background, `#f0f0f0` text, `#4C8BD0` accent (blue), `#00D4AA` prediction accent (mint)
- **Light theme:** `#f5f5f5` background, `#111111` text, `#3A7BC8` accent, `#009977` prediction accent
- **Semantic colors:** `positive` (green), `negative` (red), `textSecondary`, `textMuted`, `textFaint`
- **Fonts:** Anton 400 (display headlines), Inter 300/400/600/700 (body), JetBrains Mono 400/700 (mono/labels), BlauerNue (brand/logo only)
- **Definitions:** `apps/mobile/constants/theme.ts` and `apps/mobile/constants/typography.ts`

## Deployment

**API server** is deployed on **Railway** (account: tldrcryptolink@gmail.com, workspace: breakthesimulation).
The repo root `Dockerfile` is used for builds (Node 20, tsup bundler, serves `dist/index.mjs`).

### Production

- **Project:** MintFeed V3, **Environment:** production
- **Service:** mintfeed-api
- **Branch:** `main` (auto-deploys on push)
- **URL:** `https://mintfeed-api-production.up.railway.app`
- **Database:** Supabase production project

### Staging

- **Project:** MintFeed V3, **Environment:** staging
- **Branch:** `stage` (auto-deploys on push)
- **URL:** `https://mintfeed-api-staging.up.railway.app`
- **Database:** Supabase staging project (`mintfeed-staging`)

### Deploy Commands

```bash
# Deploy to staging (auto on push to stage, or manual):
railway link -e staging
railway up

# Deploy to production (auto on push to main, or manual):
railway link -e production
railway up

# Check logs
railway logs --lines 50

# Run commands with staging env vars (e.g. push schema):
railway link -e staging
railway run -- npx prisma db push --schema packages/db/prisma/schema.prisma
```

### Branch Workflow

```
develop on stage → test on staging → PR stage → main → production
```

## Push Notifications

### Firebase / FCM

| Item | Value |
|------|-------|
| Firebase project | `midnight-adc10` |
| Firebase console | [console.firebase.google.com/project/midnight-adc10](https://console.firebase.google.com/project/midnight-adc10) |
| Android package | `com.mintfeed.app` |
| `google-services.json` | `apps/mobile/google-services.json` (gitignored, decoded from GitHub secret in CI) |
| FCM auth | V1 API via service account `firebase-adminsdk-fbsvc@midnight-adc10.iam.gserviceaccount.com` |

### Expo Push Service

| Item | Value |
|------|-------|
| Expo account | `sebmonty` |
| EAS project ID | `d1a61761-77d0-4831-ac18-eb984eca0f29` |
| EAS slug | `mintfeed` (must match `slug` in `apps/mobile/app.json`) |
| FCM V1 key | Uploaded to Expo via GraphQL, linked to `com.mintfeed.app` Android credentials |
| Server SDK | `expo-server-sdk` in `apps/api` — sends to Expo, which routes through FCM |

### Notification Architecture

```
Mobile app                          Server (Hono)                    Expo Push Service
─────────                          ──────────────                   ─────────────────
getExpoPushTokenAsync()  ──POST──▶ /notifications/register
                                   stores PushDevice in DB

Trigger (cron/article/market) ──▶  broadcastNotification()  ──POST──▶ exp.host/--/api/v2/push/send
                                   sendSettlementNotification()       │
                                                                      ▼
                                                                   FCM V1 API ──▶ Android device
```

### Credentials & Secrets

| Secret | Where | Purpose |
|--------|-------|---------|
| `GOOGLE_SERVICES_JSON` | GitHub Actions | Base64-encoded `google-services.json`, decoded before `expo prebuild` |
| FCM V1 service account key | Expo (EAS credentials) | Allows Expo push service to send via FCM V1 |
| `google-services.json` | Local (`apps/mobile/`, gitignored) | Firebase client config for local/dev builds |

### Android Notification Channels

Configured in `apps/mobile/hooks/useNotifications.ts`, referenced in `apps/api/src/services/notification.service.ts`:

| Channel ID | Name | Importance | Maps to |
|------------|------|------------|---------|
| `breaking-news` | Breaking News | HIGH | `BREAKING_NEWS` |
| `market-movers` | Market Movers | DEFAULT | `MARKET_MOVER` |
| `settlements` | Bet Settlements | HIGH | `PREDICTION_SETTLED` |

### Throttling

- **Daily cap:** 3 notifications per device (settlements exempt)
- **Cooldown:** 30 minutes between sends per device
- **Quiet hours:** Device-local time, default 23:00–07:00
- **Dedup:** `referenceId` prevents duplicate sends for same event

### Debug & Test Endpoints (staging only)

- `GET /api/v1/notifications/debug` — lists registered devices + recent logs
- `POST /api/v1/notifications/test` — sends test notification to all active devices

### iOS (not yet configured)

No APNs credentials uploaded. No `GoogleService-Info.plist` (not needed — iOS uses APNs, not FCM). To set up: `eas credentials -p ios` auto-generates APNs key.

## Environment Variables

See `.env.example`. Key variables:

**API (required):** `DATABASE_URL`, `DIRECT_URL`, `GEMINI_API_KEY`, `COINGECKO_API_URL`, `PORT`, `SOLANA_RPC_URL`
**API (optional):** `JUPITER_API_KEY`, `TWITTER_BEARER_TOKEN`, `ADMIN_SECRET` (enables admin endpoints), `ALLOWED_ORIGINS`, `HELIUS_API_KEY`
**Mobile:** `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SOLANA_RPC_URL`, `EXPO_PUBLIC_SOLANA_CLUSTER`

## Rules

Source rule files in `.agents/rules/` are canonical. See those files for:
- Clean code standards (clean-code.mdc)
- Conventional Commits format (commit-message-format.mdc)
- PR format (pr-message-format.mdc)
- External context security (prompt-injection-gaurd.mdc)
