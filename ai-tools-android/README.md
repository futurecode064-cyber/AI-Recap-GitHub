# Future Code AI Tools Android Beta

Standalone package: `mm.futurecode.aitools`, version 1.0.0 (versionCode 1), min Android 8.0.

Displays the **live** AI Tools web catalog via Android WebView. External AI services open in the device browser. UpdateWorker checks `tools.json` and `android-version.json` approximately every six hours when network connectivity is available. On a *new catalog revision* it sends an Android local notification, even if the UI is closed, subject to OS background scheduling and Android 13+ notification permission. Also signals a higher APK version if `apkUrl` is populated.

- Tool catalog text updates automatically without reinstalling APK.
- **Not** instant server push; background checks can be delayed by Android power management.
- **Not** unattended APK installation. Android version updates still require a signed APK with same signing certificate + higher versionCode + user install consent, or managed Play update.
- GitHub Actions produces a **debug-signed beta** APK for testing only. A fresh production release-signing keystore and persistent secure GitHub secrets are required before distributing an upgradable release APK. Do not use a different debug APK as an in-place update.

## VPN-off core architecture (2026-11-16)
- VersionCode 2: MainActivity loads full site bundle + 1,200-tool catalogue from Android packaged assets with WebViewAssetLoader, not github.io, workers.dev or pages.dev.
- Search, filters, detail pages, favorites, collections and comparisons work without Internet or VPN. Official third-party websites still require their own connectivity.
- UpdateWorker attempts https://future-code-app-downloads-064.cheeky-elf-5504.chatgpt.site/ai-tools/ every ~6h when connected. This /ai-tools/ route is ONLY a planned extension of the existing user's gateway, not a verified/deployed URL yet.
- Once that route serves matching tools.json and updates.json with JSON content type, checks cache new JSON under private internal storage, keeping offline features and notifying version changes. Until then, everything uses bundled catalogue and the poll is harmless.
- A debug APK is not the signed production release; use release keystore and keep a stable certificate for update installs. Android cannot silently replace installed APKs without platform-managed update.
- The hosted browser website still needs a separately published gateway mirror. An existing chatgpt.site gateway cannot be mutated through the GitHub connector.
