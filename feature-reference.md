# Midnight App — Feature & Fix Reference

## Features

1. **Pull-to-refresh feed** — User swipes down on feed to pull latest news from API. Triggers refetch with loading state.

2. **Haptic feedback on navbar links** — All navbar navigation links (Home, Market, Settings) trigger appropriate haptic feedback on tap.

3. **App Notifications** — Add push notification support (likely via Expo Notifications or native equivalent). User can receive alerts for new articles, prediction market updates, transaction status.

## Fixes

4. **Limit markets per card to 2 max** — Any news card on the feed should display no more than 2 relevant prediction markets. Current behavior may show more.

5. **Update Twitter feed sources** — Refresh/update the list of Twitter accounts being scraped as RSS sources. Check `packages/db/prisma/seed-twitter-sources.ts`.

6. **Quick Bets preset amounts** — Change from `[1, 2, 5, 10, 25]` to `[5, 10, 25, 50]`. User can input custom amount above 5. Minimum bet should be enforced at 5.

7. **Toast notification consolidation** — Currently, when user swipes to take a bet, Sonner toast appears multiple times (pending, success, error states). Instead, open once and update its content in-place as transaction status changes.
