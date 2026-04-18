# Solana dApp Store submission

This directory holds the Midnight listing content for [publish.solanamobile.com](https://publish.solanamobile.com).

## One-time setup

1. Sign in at `publish.solanamobile.com` and create the publisher + app for `com.midnight.app`.
2. Generate an API key: Dashboard → Settings → API Keys.
3. Store the key as an EAS secret and a GitHub Actions secret named `DAPP_STORE_API_KEY`:
   ```bash
   eas secret:create --scope project --name DAPP_STORE_API_KEY --value <key>
   gh secret set DAPP_STORE_API_KEY --body <key>
   ```
4. Back up the Android release keystore from EAS (`eas credentials -p android`). Losing it means you can't update the app.

## Required assets (drop into this directory)

- `icon.png` — 512×512 PNG
- `banner.png` — 1920×1080 PNG (feature graphic)
- `screenshots/` — 4–8 portrait PNGs, ≥1080×2340 (real device captures preferred)
- `preview.mp4` *(optional)* — 30–60s portrait, ≤30 MB

## Metadata

Edit `metadata.json` for listing content: short/long description, categories, support email, privacy policy URL. The description and categories still need legal/marketing review before submission.

## Submit a new version

After EAS builds a production APK:

```bash
pnpm dapp-store:submit \
  --apk-file ./build.apk \
  --whats-new "Initial release: swipe feed, prediction markets, push notifications"
```

In CI this runs automatically on a `v*` tag — see `.github/workflows/dapp-store.yml`.
