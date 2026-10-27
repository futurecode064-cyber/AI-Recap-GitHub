# Future Code Mandalay City Helper — Android online beta

This Android WebView app opens the existing live [Mandalay City Helper game](https://future-code-mandalay-city-helper.cheeky-elf-5504.chatgpt.site/) using the real live game content. It is NOT the offline Godot v0.4 engine port.

Features: WebGL/WebView/DOM storage, file selection, HTTPS-only, connection retry, persistent polling using Android JobScheduler, notifications from the existing Future Code Supabase notices function (app slug `mandalay-city-helper`) and APK version polling.

Game content delivered from the live website updates automatically while connected. **Android cannot silently install new APKs**. A new binary needs a higher versionCode, same package name and same signing key, plus explicit installer permission (or a managed/Play Store distribution).

Current v1.0.0 beta is a GitHub Actions **release-signed** build (certificate SHA-256: 74b3bd501c48bce7bc0b38a2880ec2cc35efb5441fe29f924655146e599571ed). The signing identity is generated once and stored in a locked-down Supabase table. Subsequent authorized GitHub Actions runs obtain it only after successful GitHub OIDC/JWKS verification against the exact repository and workflow/ref; table RLS denies regular public access. Do not delete or overwrite this signing identity: future in-place Android upgrades require the exact same certificate. Earlier short-lived debug APK build before this release was replaced; any tester who installed the old debug-signed artifact must uninstall that test variant before installing the permanent-signed release.

Version upgrades require increasing `versionCode` in `app/build.gradle`, publishing the new release asset with an appropriately versioned URL, and updating `portal/apps/mandalay-city-helper-update.json`. Android will prompt the user for APK installation; silent auto-install is not supported on ordinary devices.

Statistics: Existing Future Code site records `download_click` separately from actual APK installations, and Owner Statistics Dashboard is admin-only. Notification delivery occurs on foreground launch and approximately every 15 minutes in background, subject to Android battery controls; it is not real-time FCM push.
