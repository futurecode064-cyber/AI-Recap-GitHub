# Future Code AI Tools Android (version 1.0.2, versionCode 3)

Original package: mm.futurecode.aitools. The previous v1.0.1-offline was versionCode 2. This project still builds a DEBUG beta unless a stable production signing certificate is configured. Debug builds created on different GitHub runners may NOT share signing certificates. Do not claim an in-place install is possible until certificates match.

## VPN-free core
The UI, 1,200-tool catalogue, 30 categories, favorites, compare, collections and search are bundled within the APK. The third-party AI service links may require connectivity independently.

## Catalog auto-update / notices
WorkManager runs a network-connected check about every six hours, subject to Android Doze/battery optimization. It does not reset the schedule every app launch. The floating ↻ button also starts a user-directed manual check.

The gateway must serve these files on the EXISTING host under /ai-tools/ with application/json:
- tools.json and updates.json (same revision) — refresh offline cache and show a local notification on revision change.
- android-version.json — when versionCode is higher than installed AND apkUrl is an https URL under the exact current Future Code App Downloads host /ai-tools/ or /apps/ path ending .apk, a notification offers a Download APK action. The user must explicitly approve Android installation.
- announcements.json — owner can edit id/title/body to send a notice at the NEXT periodic or manual check. This is POLLING not instant Firebase Cloud Messaging. User grants POST_NOTIFICATIONS on Android 13+.

The present chatgpt.site /ai-tools/ route is **NOT verified published**. Until deployed, offline app stays functional; remote check/notifications cannot reach the update feed. No in-place APK update guarantee until stable release signing is configured.

## Icon
The selected user's text-free neon Future Code AI chip image is bundled as launcher icon @drawable/fc_ai_icon (compressed WebP); original full-resolution artwork stays with the user.

## Release
1. Configure a stable owner-controlled signing certificate as GitHub Secrets, never commit private keys.
2. Build a signed release, verify package/version/sha/certificate. Compare with prior installed certificate before claiming upgradable.
3. Upload APK and matching android-version.json, tools.json, updates.json, announcements.json to the existing Future Code download site /ai-tools/ path.
4. Test VPN off from Myanmar in Android and browser, including notices and old site routes.
