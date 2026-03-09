<div align="center">
  <img src="assets/adaptive-icon.png" width="96" alt="Midnight logo">

  # Midnight

  *Crypto & AI news in 60 words — swipe, bet, stay informed.*

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Expo SDK](https://img.shields.io/badge/Expo_SDK-52-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
  [![Hono](https://img.shields.io/badge/Hono-4.6-E36002?style=flat-square)](https://hono.dev/)
  [![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
  [![License](https://img.shields.io/badge/License-Private-gray?style=flat-square)](LICENSE)

  [Features](#features) | [Architecture](#architecture) | [Getting Started](#getting-started) | [Development](#development) | [Deployment](#deployment)

</div>

---

Midnight is a mobile-first news app that delivers crypto and AI headlines in a TikTok-style vertical swipe feed. Each article is paired with live prediction markets from Jupiter, letting users trade on outcomes directly from the news card. Built as a Turborepo monorepo with an Expo React Native frontend and a Hono API backend.

## Features

- **Vertical swipe feed** — Full-screen news cards with native page transitions, infinite scroll, and read tracking
- **AI-powered summaries** — Every article is rewritten by AI into a 60-word summary
- **Prediction markets** — Jupiter prediction markets matched to articles in real-time, with YES/NO trading via USDC
- **Live crypto prices** — Top coins by market cap
- **Multi-wallet support** — Connect Phantom, Backpack, Solflare, Jupiter, or Seeker to trade on Solana
- **Dark-first design** — Engineered aesthetic with Anton/Inter/JetBrains Mono typography on a `#030303` canvas

## Architecture

```
mintfeed-v3/
├── apps/
│   ├── api/             Hono REST API (Node.js)
│   └── mobile/          Expo SDK 52 React Native app
├── packages/
│   ├── db/              Prisma ORM + PostgreSQL schema
│   └── shared/          Shared types, constants, validators
├── turbo.json           Turborepo task configuration
└── pnpm-workspace.yaml  Workspace definition
```

| Layer | Stack |
|-------|-------|
| **Mobile** | Expo Router v4, React Native, TanStack Query, Zustand, Reanimated |
| **API** | Hono, Node.js, node-cron, Gemini API, CoinGecko API, Jupiter API |
| **Database** | PostgreSQL (Supabase), Prisma ORM |
| **Blockchain** | @solana/web3.js, Mobile Wallet Adapter |
| **Build** | Turborepo, pnpm, tsup, TypeScript |

### Data flow

1. **Cron jobs** fetch RSS feeds every 15 min, deduplicate by URL hash, summarize via Gemini, generate blurhash placeholders, and store articles
2. **Market matching** links articles to relevant Jupiter prediction markets
3. **Price refresh** updates top 20 crypto coins from CoinGecko every 5 min and prediction market odds every 5 min
4. **Mobile client** consumes cursor-paginated feed and market endpoints via ky + TanStack Query

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9.x
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- PostgreSQL database ([Supabase](https://supabase.com/) recommended)
- API keys: [Gemini](https://ai.google.dev/), [CoinGecko](https://www.coingecko.com/en/api), [Jupiter](https://www.jup.ag/)

### Setup

1. **Clone and install**

   ```bash
   git clone https://github.com/cryptoclassdev/mintfeed-v3.git
   cd mintfeed-v3
   pnpm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Fill in your database URLs, API keys, and RPC endpoint. See `.env.example` for all required variables.

3. **Initialize the database**

   ```bash
   pnpm db:generate        # Generate Prisma client
   pnpm db:push            # Push schema to database
   pnpm --filter db db:seed  # Seed RSS feed sources
   ```

4. **Start development**

   ```bash
   pnpm dev                # Runs API + Expo dev server in parallel
   ```

   The API starts on `http://localhost:3000`. The Expo dev server will display a QR code for the mobile app.

## Development

```bash
# Run everything
pnpm dev

# Run individual apps
pnpm --filter api dev         # API server
pnpm --filter mobile dev      # Expo dev server

# Mobile platforms
pnpm --filter mobile ios      # iOS simulator
pnpm --filter mobile android  # Android emulator

# Type-check
pnpm lint

# Database
pnpm db:generate              # After schema changes
pnpm db:push                  # Push schema to database
```

### API Endpoints

All routes are prefixed with `/api/v1`:

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/feed?category=all\|crypto\|ai&cursor=<id>&limit=20` | Paginated article feed |
| `GET` | `/feed/:id` | Single article with prediction markets |
| `GET` | `/market` | Top 20 crypto prices |
| `GET` | `/health` | Health check |

### Project Structure (Mobile)

```
apps/mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx        Vertical swipe feed
│   │   ├── market.tsx       Crypto price list
│   │   └── settings.tsx     Preferences
│   ├── article/[id].tsx     Article detail modal
│   └── market-sheet/[id].tsx  Prediction market sheet
├── components/              UI components
├── hooks/                   Data fetching + state hooks
├── constants/               Theme, typography, layout
└── lib/                     API client, store, utilities
```

## Deployment

### API (Railway)

The backend deploys to [Railway](https://railway.app/) via Docker:

```bash
railway link    # One-time: link repo to project
railway up      # Deploy current code
railway logs --lines 50
```

> [!NOTE]
> Railway account: `tldrcryptolink@gmail.com`, workspace: `breakthesimulation`, project: `MintFeed V3`.
> Auto-deploys are triggered on push to `main` via GitHub integration.

### Mobile (EAS Build)

The mobile app builds via [Expo Application Services](https://expo.dev/eas):

```bash
eas build --platform android
eas build --platform ios
```

Local APK build:

```bash
cd apps/mobile
npx expo export --platform android
cd android && ./gradlew assembleRelease
```

The APK outputs to `apps/mobile/android/app/build/outputs/apk/release/`.
