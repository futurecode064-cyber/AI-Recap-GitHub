# Future Code AI Tools Android Beta

Standalone package: `mm.futurecode.aitools`, version 1.0.0 (versionCode 1), min Android 8.0.

Displays the **live** AI Tools web catalog via Android WebView. External AI services open in the device browser. UpdateWorker checks `tools.json` and `android-version.json` approximately every six hours when network connectivity is available. On a *new catalog revision* it sends an Android local notification, even if the UI is closed, subject to OS background scheduling and Android 13+ notification permission. Also signals a higher APK version if `apkUrl` is populated.

- Tool catalog text updates automatically without reinstalling APK.
- **Not** instant server push; background checks can be delayed by Android power management.
- **Not** unattended APK installation. Android version updates still require a signed APK with same signing certificate + higher versionCode + user install consent, or managed Play update.
- GitHub Actions produces a **debug-signed beta** APK for testing only. A fresh production release-signing keystore and persistent secure GitHub secrets are required before distributing an upgradable release APK. Do not use a different debug APK as an in-place update.
