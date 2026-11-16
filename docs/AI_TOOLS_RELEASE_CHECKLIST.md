# Future Code AI Tools — Update/Notification + Stable Release Checklist

Status as of 2026-11-16: v1.0.2 (versionCode 3) **DEBUG BETA** built and ZIP packaged. The selected FC + AI Tools chip icon is bundled, and all 1,200 catalog tools are offline-first. The existing chatgpt.site project has not been published from GitHub.

## Catalog Auto Updates

Android WorkManager checks the user's existing gateway at:
`https://future-code-app-downloads-064.cheeky-elf-5504.chatgpt.site/ai-tools/`

Every ~6h when connected, or on manual ↻ action. Only a valid 30-category / 1,000+-tool JSON is cached locally. When catalog revision changes, Android notification is posted (if OS permission granted). Real-time server-initiated push is not present.

## Admin announcements

The gateway's `announcements.json` contains `id`, `title`, `body`, `publishedAt`. To send a poll-based notice, edit the file in the original gateway's public /ai-tools/ folder, changing `id` each time. Android delivers on the next check (subject to OS background scheduling); it does not guarantee immediate delivery. First announcement seen becomes baseline, not a spurious welcome notification. For instantaneous pushes, add FCM device token opt-in and authenticated sender separately.

## APK versions

The feed's `android-version.json` should contain `versionCode`, `versionName`, `apkUrl`, `releaseNotes` after the *SIGNED* APK is uploaded and validated. Only URLs on the existing exact gateway hostname under /ai-tools/ or /apps/ and ending .apk will be offered. The user taps notification to download and confirms Android installation. Silent self-install of APKs is not supported on ordinary Android phones.

## Signing gate

Android v1.0.1 was a debug beta using an ephemeral GitHub Actions keystore. A fresh debug build can have a different signing certificate; **DO NOT claim it can update an installed APK**.

Owner needs to set stable GitHub Actions Secrets: `FC_AI_TOOLS_KEYSTORE_B64`, `FC_AI_TOOLS_STORE_PASSWORD`, `FC_AI_TOOLS_KEY_ALIAS`, `FC_AI_TOOLS_KEY_PASSWORD`. Keep original keystore and passwords securely outside GitHub source control. Never paste those in chat.

After these exist, manually run workflow `ai-tools-android-release.yml` and inspect apksigner certificate SHA-256 and APK SHA-256. Only release this newly signed build after real Android installation tests; preserve the exact keystore for ALL future updates (higher versionCode).

## Existing Future Code App Download site

Website handoff ZIP workflow contains /ai-tools/download.html, icon, tools, notice feeds and beta APK. This is **not live publication** because the original ChatGPT Sites editor is not connected to this session. Publish into existing `future-code-app-downloads-064.cheeky-elf-5504.chatgpt.site`, preserving all prior /apps/ and /myanmar-kyar/ URLs; add the AI Tools card to /apps/ catalog. Only after authenticated Sites deployment and VPN-OFF user-side tests should the website be represented as published.
