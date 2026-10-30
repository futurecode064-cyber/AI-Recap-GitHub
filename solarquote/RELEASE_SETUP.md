# SolarQuote automatic update release setup

## Implemented
- Android v1.0.1 (versionCode 2) checks https://raw.githubusercontent.com/futurecode064-cyber/AI-Recap-GitHub/main/solarquote/latest.json on app start (once per 24 hours), and offers an in-app manual update check.
- The app does not download any release automatically without explicit user approval. It verifies HTTPS, SHA-256, applicationId, versionCode, and the installed APK signing certificate before opening Android's installer.
- Release workflow: `.github/workflows/solarquote-publish-signed.yml`; Android project is `solarquote/source.zip`.
- Release output is published to `solarquote/releases/FutureCodeSolarQuote-vVERSION.apk` and `solarquote/latest.json`.

## One-time owner action
An owner-only persistent signing secret is required. Download the private signing backup delivered in ChatGPT. Open the contained `SOLARQUOTE_SIGNING_BUNDLE_B64.txt`. In this repository open **Settings > Secrets and variables > Actions > New repository secret**. Set name to `SOLARQUOTE_SIGNING_BUNDLE_B64` and value to the entire text (one line). Never commit or share it. Re-run **Actions > SolarQuote - Signed APK and Update Channel** once after the secret exists.

Future commits that change `solarquote/source.zip` invoke the workflow automatically. On success, the workflow signs with the same stored key, verifies the signed release, uploads the APK, and updates the public `latest.json` (including its SHA-256) without changing other website sections.

## Compatibility caveat
The old v1.0.0 debug APK was signed by a transient CI debug keystore. It cannot update in place to the new release signing certificate. Export existing customer quotes before reinstalling to avoid losing data. Starting with the first release signed with the new persistent key, future releases can update in place as long as the package ID remains `com.futurecode.solarquote`, the key stays identical, and the versionCode strictly increases.

## Security
Do not upload private signing material to a public repository or APK. An Android system confirmation/unknown-source permission is always required for non-Play updates. The GitHub secret is deliberately not committed to version control.
