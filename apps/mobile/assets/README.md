# Mobile app assets

Current files here are used by `app.json` for icons, splash, and notifications. Before dApp Store submission, replace these with production-quality versions:

| File | Purpose | Required spec |
|------|---------|---------------|
| `icon.png` | iOS/general launcher icon | 1024×1024 PNG, square, no alpha, rounded Midnight tile treatment |
| `adaptive-icon.png` | Android adaptive launcher foreground | 1024×1024 PNG, transparent background, rounded tile inside mask safe zone |
| `splash.png` | Full-resolution native splash plate | 1242×2436 PNG, dark bg (#030303), compact icon tile + lowercase `midnight` |
| `splash-logo.png` | Native splash plugin logo | Transparent PNG, compact icon tile + lowercase `midnight`; keep static and minimal |
| `splash-tile.png` | React startup intro tile | 220×220 PNG, transparent background, rounded Midnight tile used with live text animation |
| `intro-mark.png` | Reusable raw brand mark | Transparent PNG, tightly cropped moon/mountain mark |
| `notification-icon.png` | Android notification channel icon | 96×96 PNG, **monochrome white on transparent**. Android renders color icons as white squares. |

## Wiring

When you have the missing files, update `app.json`:

```json
"splash": { "image": "./assets/splash.png", ... }

"plugins": [
  ...
  ["expo-notifications", { "icon": "./assets/notification-icon.png", "color": "#4C8BD0" }]
]
```

Keep launcher and listing icons safe-padded so Android masks, dApp Store cards, and splash surfaces do not crop the moon/mountain mark.
