# Future Code AI Studio

Current delivery: **v8 / 1.4.1**, native package `mm.futurecode.videostudio.pro`.

[Student Portal](https://futurecode064-cyber.github.io/AI-Recap-GitHub/student/) · [Admin Dashboard](https://futurecode064-cyber.github.io/AI-Recap-GitHub/admin/)

The current academy APK source is `training-app/`. `portal/` contains the account dashboards and generated browser copies of the current academy/studio pages. The earlier Kotlin `app/` and standalone `web-app/` prototypes are retained separately and do not produce this academy APK.

Eight modules share `training-app/assets/studio/modules.json`: lessons/prompt builders, downloads, tool directory, documents/design/invoice, image studio, video maker, recap editor, and lesson-video groups. Lessons and tool guides are nested; the group section is last. Existing gate section keys remain compatible through permission aliases. Accounts bind to one APK device or browser device key; switching requires the owner's Admin Device Reset. An app update keeps the existing APK device key.

## Validate and publish

```bash
python3 scripts/build_portal.py
python3 tests/validate_assets.py
node tests/access.test.js
node tests/portal.test.js
node tests/studio.test.js
```

Pushes of portal/current assets run `.github/workflows/future-code-portal-pages.yml`, validate source, then deploy `portal/` to GitHub Pages. Builds do not download previous app ZIPs.

## Build the signed APK

Use the owner's existing release key, never a new generated key:

```bash
python3 scripts/build_apk.py --android-jar /path/to/android.jar --build-tools /path/to/build-tools --keystore /private/release.p12 --password-file /private/password.txt
```

Use `--ecj-jar` if javac is unavailable. Output is `build/Future_Code_AI_Studio_v8.apk`. Keep private signing files outside this public repository. Optional GitHub build secrets are `RELEASE_KEYSTORE_BASE64` and `RELEASE_KEYSTORE_PASSWORD`; when absent, CI validates source and explicitly skips signed artifact production. The locally delivered APK is signed using the owner's preserved v7 key.

Image/video/voice AI requests use the student's own Google API key in memory. Model availability, region, quota and billing are provider-specific. Manual scene editing and local export work without an AI key when the browser/device supports the selected media codecs. Do not commit API keys or account passwords. See `VERIFICATION.md` for tested behavior and physical-device/live-generation limits.
