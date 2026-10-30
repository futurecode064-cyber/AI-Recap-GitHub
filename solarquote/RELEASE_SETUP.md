# Future Code SolarQuote – Signed auto-update release

## Verified October 30, 2026
- **Status:** GitHub Actions signed APK release successful.
- **GitHub Actions run:** https://github.com/futurecode064-cyber/AI-Recap-GitHub/actions/runs/41004865369
- **Version:** 1.0.1 (versionCode 2)
- **Application ID:** `com.futurecode.solarquote`
- **Signed APK:** `solarquote/releases/FutureCodeSolarQuote-v1.0.1.apk`
- **Update manifest:** `solarquote/latest.json`
- **APK SHA-256:** `8a133520165c6a9131f412526d844823c8880c5d269855d04789bba365bba183`

## How builds and updates work
1. Source is stored in `solarquote/source.zip`, triggered by the workflow `.github/workflows/solarquote-publish-signed.yml`.
2. GitHub Actions obtains a short-lived OIDC identity token scoped to the authorized workflow.
3. The existing `fc-solarquote-signing` Supabase Edge Function verifies GitHub's JWT issuer, signature, audience, repository ID, branch, and workflow path.
4. On the first successful build, a dedicated SolarQuote signing certificate was generated once and stored in a non-public Supabase `app_private.fc_solarquote_signing` table.
5. Future builds retrieve the same signing key through the authorized OIDC channel, sign and verify the release APK, upload an artifact, and publish both APK and SHA-256 update manifest.
6. The Android app checks the manifest on startup at most once per 24 hours or on manual request; it downloads an update only with user consent and checks APK SHA-256, package, version, and signer before invoking the system installer.

**No manual `SOLARQUOTE_SIGNING_BUNDLE_B64` GitHub repository secret is needed**. The prior manual-secret setup instruction has been retired.

## Existing debug APK caveat
The older v1.0.0 and v1.0.1 debug APKs use a different temporary CI debug signing certificate, and **cannot update in place** to the signed production APK. Export or safely preserve existing customer projects before uninstalling a debug build, then install this stable v1.0.1 APK once. All subsequent release builds can update in place as long as the application ID, signing certificate, and increasing versionCode rules hold.

**The previous SolarQuote signing backup ZIP provided before this build is not the keystore used by the newly established OIDC signing service. Do not use it for future upgrades.** Protect the Supabase project and database; a separate secure disaster-recovery export of the permanent key is a recommended follow-up.

## Release gate
- Increase versionCode and versionName in the project's `app/build.gradle.kts`.
- Update `solarquote/source.zip` on main or manually dispatch the signed-release workflow.
- Confirm Actions job succeeded, release `apksigner` verification passed, and `latest.json` points to the new APK and correct checksum.
- Android device installation and in-place upgrade should still be tested on real devices. The installer always requires Android user approval; this is not silent unattended installation.
