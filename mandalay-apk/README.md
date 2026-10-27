# Future Code Mandalay City Helper — Android online beta

This Android WebView app opens the existing live [Mandalay City Helper game](https://future-code-mandalay-city-helper.cheeky-elf-5504.chatgpt.site/) using the real live game content. It is NOT the offline Godot v0.4 engine port.

Features: WebGL/WebView/DOM storage, file selection, HTTPS-only, connection retry, persistent polling using Android JobScheduler, notifications from the existing Future Code Supabase notices function (app slug `mandalay-city-helper`) and APK version polling.

Game content delivered from the live website updates automatically while connected. **Android cannot silently install new APKs**. A new binary needs a higher versionCode, same package name and same signing key, plus explicit installer permission (or a managed/Play Store distribution).

Current v1.0.0 beta is a GitHub Actions debug-signed build. Do not promise seamless binary version upgrades from this build: the GitHub-hosted runner's debug key does not persist. Before a production release, configure a persistent private release signing key in GitHub Secrets and migrate first-install users appropriately.

Statistics: Existing Future Code site records `download_click` separately from actual APK installations, and Owner Statistics Dashboard is admin-only. Notification delivery occurs on foreground launch and approximately every 15 minutes in background, subject to Android battery controls; it is not real-time FCM push.
