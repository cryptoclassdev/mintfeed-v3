# PRD: Staging Environment Setup

**Status:** Draft
**Author:** Claude
**Date:** 2026-03-12
**Branch:** `stage`

---

## Problem

All development, testing, and production share a single Railway deployment and a single Supabase database. Any change pushed to `main` immediately affects real users. There is no safe way to test API changes, database migrations, or mobile app behavior without risking production.

## Goal

Create a fully isolated staging environment where code on the `stage` branch auto-deploys to a separate API server backed by a separate database. The mobile app can switch between staging and production with a single env var change.

**Success criteria:**
1. Push to `stage` → deploys to staging API (separate URL)
2. Push to `main` → deploys to production API (existing URL)
3. Staging uses its own Supabase database — zero shared state with production
4. Mobile app can target either API via `EXPO_PUBLIC_API_URL`
5. EAS build profiles exist for `preview` (staging) and `production`
6. All of this documented in `AGENTS.md`

---

## Non-Goals

- CI/CD pipelines (GitHub Actions) — Railway handles deployment
- Separate Solana cluster (devnet vs mainnet) — both environments use mainnet since prediction market trading is user-initiated
- Separate Privy apps — same auth provider for both environments
- Automated database seeding on deploy — manual step, run once

---

## Architecture

```
                  ┌─────────────┐
                  │   GitHub    │
                  │  Repo       │
                  └──────┬──────┘
                         │
              ┌──────────┴──────────┐
              │                     │
         main branch          stage branch
              │                     │
              ▼                     ▼
   ┌──────────────────┐  ┌──────────────────┐
   │  Railway          │  │  Railway          │
   │  production env   │  │  staging env      │
   │                   │  │                   │
   │  midnight-api     │  │  midnight-api     │
   │  :3000            │  │  :3000            │
   └────────┬──────────┘  └────────┬──────────┘
            │                      │
            ▼                      ▼
   ┌──────────────────┐  ┌──────────────────┐
   │  Supabase         │  │  Supabase         │
   │  Production DB    │  │  Staging DB       │
   │  (existing)       │  │  (new project)    │
   └──────────────────┘  └──────────────────┘

   Mobile app reads EXPO_PUBLIC_API_URL to decide which API to hit.
```

---

## Implementation Plan

### Step 1: Create Staging Supabase Project

**What:** Create a new Supabase project for the staging database.

**Actions:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → New Project
2. Name: `mintfeed-staging`
3. Region: same as production (`eu-north-1`) for consistency
4. Copy the connection strings:
   - `DATABASE_URL` (pooler, port 6543, `?pgbouncer=true`)
   - `DIRECT_URL` (direct, port 5432)

**Verify:** Can connect via `psql` using the direct URL.

---

### Step 2: Create Railway Staging Environment

**What:** Add a `staging` environment to the existing MintFeed V3 Railway project. This gives a separate deployment with its own env vars and URL, auto-deployed from the `stage` branch.

**Actions (Railway Dashboard):**
1. Open [railway.com](https://railway.com) → MintFeed V3 project
2. Click the environment dropdown (top-left, currently says "production") → **New Environment**
3. Name: `staging`
4. Railway will clone the service structure. The `midnight-api` service will exist in staging but with no deployments yet.

**Actions (Railway CLI):**
```bash
# Link to the staging environment
railway link -p 6bbf0c4e-1536-4dea-947c-686b069c09ea -e staging

# Verify
railway status
# Should show: Environment: staging
```

**Verify:** `railway status` shows `Environment: staging`.

---

### Step 3: Configure Staging Environment Variables

**What:** Set env vars for the staging Railway environment. Most are shared with production, but database URLs point to the staging Supabase project.

**Actions (Railway CLI or Dashboard):**
```bash
# Database — MUST be different from production
railway variables set DATABASE_URL="postgresql://postgres.STAGING_REF:password@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
railway variables set DIRECT_URL="postgresql://postgres.STAGING_REF:password@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"

# These can be the same as production
railway variables set GEMINI_API_KEY="<same key>"
railway variables set COINGECKO_API_URL="https://api.coingecko.com/api/v3"
railway variables set JUPITER_API_KEY="<same key>"
railway variables set PORT="3000"
railway variables set SOLANA_RPC_URL="<same RPC>"
```

**Verify:** `railway variables` lists all expected keys. `DATABASE_URL` differs from production.

---

### Step 4: Connect GitHub Branch to Staging Environment

**What:** Configure Railway to auto-deploy the `stage` branch to the staging environment.

**Actions (Railway Dashboard):**
1. Switch to the **staging** environment (dropdown)
2. Click **midnight-api** service → **Settings**
3. Under **Source** → Connect repo `cryptoclassdev/midnight-v3`
4. Set **Branch** to `stage`
5. Ensure the **Dockerfile** builder is selected (should auto-detect)

**Production check:** Verify the production environment is still set to deploy from `main`.

**Verify:** Push a no-op commit to `stage` and confirm Railway starts a build in the staging environment.

---

### Step 5: Generate Railway Domain for Staging

**What:** The staging service needs a public URL.

**Actions (Railway Dashboard or CLI):**
```bash
railway domain
# This generates a URL like: midnight-api-staging.up.railway.app
```

If the auto-generated domain isn't clear enough, set a custom one via the dashboard.

**Verify:** After first deployment, `curl https://<staging-url>/api/v1/health` returns 200.

---

### Step 6: Push Schema to Staging Database

**What:** The staging database is empty. Push the Prisma schema and seed initial data.

**Actions:**
```bash
# Use Railway's run command to execute with staging env vars
railway run pnpm db:push
railway run pnpm --filter db db:seed
```

**Verify:** `railway run npx prisma studio` opens and shows empty tables with correct schema.

---

### Step 7: Update EAS Build Profiles

**What:** Add a `staging` build profile that bakes in the staging API URL. Update the existing `preview` profile to use staging. Add explicit `production` profile.

**File:** `apps/mobile/eas.json`

**Current:**
```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" },
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://midnight-api-production.up.railway.app"
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

**Updated:**
```json
{
  "cli": {
    "version": ">= 15.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "staging": {
      "android": { "buildType": "apk" },
      "distribution": "internal",
      "channel": "staging",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://<staging-railway-url>"
      }
    },
    "preview": {
      "android": { "buildType": "apk" },
      "distribution": "internal",
      "channel": "preview",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://midnight-api-production.up.railway.app"
      }
    },
    "production": {
      "autoIncrement": true,
      "channel": "production",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://midnight-api-production.up.railway.app"
      }
    }
  }
}
```

**Usage:**
```bash
# Build APK pointing at staging API
eas build --profile staging --platform android

# Build APK pointing at production API
eas build --profile production --platform android
```

**Verify:** Build a staging APK, install on device, confirm it hits the staging API URL (visible in `__DEV__` console logs from `api-client.ts`).

---

### Step 8: Create `.env.staging` for Local Development

**What:** A `.env.staging` file so developers can run the API locally against the staging database.

**File:** `.env.staging`

```bash
# Staging Database (Supabase)
DATABASE_URL="postgresql://postgres.STAGING_REF:password@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.STAGING_REF:password@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"

# Shared API keys (same as production)
GEMINI_API_KEY="your-gemini-api-key"
COINGECKO_API_URL="https://api.coingecko.com/api/v3"
JUPITER_API_KEY="your-jupiter-api-key"

# Server
PORT=3000
SOLANA_RPC_URL="https://your-rpc-provider.example.com"
```

**Add to `.gitignore`:** `.env.staging` (contains secrets — should not be committed).

**Add to `.env.example`:** A comment noting `.env.staging` exists for staging development.

**Verify:** `.env.staging` is in `.gitignore`, not tracked by git.

---

### Step 9: Update Documentation

**What:** Update `AGENTS.md` deployment section to cover both environments.

**Updated section:**
```markdown
## Deployment

### Production
- **Platform:** Railway (account: tldrcryptolink@gmail.com, workspace: breakthesimulation)
- **Project:** MintFeed V3, Environment: production
- **Service:** midnight-api
- **Branch:** `main` (auto-deploys on push)
- **URL:** `https://midnight-api-production.up.railway.app`
- **Database:** Supabase production project

### Staging
- **Platform:** Railway (same project, staging environment)
- **Branch:** `stage` (auto-deploys on push)
- **URL:** `https://<staging-railway-url>`
- **Database:** Supabase staging project (mintfeed-staging)

### Commands
```bash
# Deploy to staging (auto on push to stage, or manual):
railway link -e staging
railway up

# Deploy to production (auto on push to main, or manual):
railway link -e production
railway up

# Check logs
railway logs --lines 50
```

### Branch Workflow
```
develop on stage → test on staging → PR stage → main → production
```
```

**Verify:** `AGENTS.md` accurately reflects both environments.

---

## Step Execution Order

| # | Step | Depends On | Owner | Verify |
|---|------|-----------|-------|--------|
| 1 | Create Supabase staging project | — | Manual (dashboard) | `psql` connects |
| 2 | Create Railway staging environment | — | Manual (dashboard) | `railway status` shows staging |
| 3 | Set staging env vars | 1, 2 | CLI or dashboard | `railway variables` correct |
| 4 | Connect `stage` branch to staging | 2 | Manual (dashboard) | Push triggers build |
| 5 | Generate staging domain | 2 | CLI or dashboard | `/health` returns 200 |
| 6 | Push schema + seed staging DB | 1, 3, 5 | CLI (`railway run`) | Tables exist in Prisma Studio |
| 7 | Update `eas.json` build profiles | 5 | Code change | Staging APK hits staging URL |
| 8 | Create `.env.staging` | 1 | Code change | File exists, gitignored |
| 9 | Update `AGENTS.md` | 5 | Code change | Docs match reality |

Steps 1 and 2 can run in parallel.
Steps 3, 4, 5 can run in parallel after 1+2.
Steps 7, 8, 9 are code changes — can be done in one commit.

---

## What Changes in the Codebase

Only **3 files** are modified or created:

| File | Change |
|------|--------|
| `apps/mobile/eas.json` | Add `staging` profile, add `channel` and `env` to `production` profile |
| `AGENTS.md` | Expand deployment section with staging details |
| `.env.example` | Add comment about `.env.staging` for local staging development |

No application code changes. No new dependencies. No refactoring.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Staging crons consume API rate limits (CoinGecko, Gemini) | Medium — could hit free-tier caps | Monitor usage; consider disabling crons in staging via env flag if needed |
| Developer accidentally links CLI to wrong environment | Low — deploys wrong code to wrong env | Always run `railway status` before `railway up` |
| Staging database drifts from production schema | Medium — migrations may not match | Always run `pnpm db:push` on staging after schema changes |
| Staging URL leaks to end users | Low — no real user data at risk | Staging DB contains only seeded/test data |

---

## Out of Scope (Future Considerations)

- **Seed script for realistic staging data** — Currently uses same seed as production (RSS sources). Could add a staging-specific seed with mock articles.
- **Environment indicator in mobile app** — A small banner showing "STAGING" when connected to the staging API. Useful but not blocking.
- **Cron toggle via env var** — `ENABLE_CRONS=false` to disable cron jobs in staging if rate limits become an issue.
- **Preview deployments per PR** — Railway supports this but adds cost. Consider later if the team grows.
