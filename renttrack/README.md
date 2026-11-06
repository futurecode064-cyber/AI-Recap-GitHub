# Future Code RentTrack v1.1.1

Offline-first Android rental management. Permanent package ID: `studio.futurecode.renttrack`. Android 9+ (API 28). A stable signing key is stored in the protected Supabase RentTrack signing vault and restored via GitHub OIDC, not committed to source.

## Core rental features
Rooms/tenants/contract dates, monthly idempotent rent billing, electricity/water fees, deposits, payment history, invoices/receipts, overdue and contract reports, CSV, AES-256-GCM encrypted backup/restore.

## App Update channel
- App checks `portal/apps/renttrack-update.json` on launch and periodically in the background using WorkManager. The HTTP endpoint only advertises verified production-signed releases.
- Settings > Update: Check now, secure APK download, user-confirmed Install, optional unmetered/Wi-Fi automatic download.
- Checks SHA-256, package ID, versionCode and signing-certificate SHA-256, including certificate match to the installed app. No silent installation.
- First official release 1.1.0. Version 1.1.1 is signed by the SAME permanent certificate, so an existing official v1.1.0 install can update in place.
- The old QA/debug v1.0.0 was signed with another key. Its data should be backed up securely, then it may need removal before installing official signed APK.
- Future versions require increasing `versionCode` and `versionName` and updating the release workflow's version constants before publish.

## Notifications
- Android 13+ asks for POST_NOTIFICATIONS when user chooses the notification button. No unrequested permission prompt.
- Native channels: APK Updates, RentTrack billing/contracts, Future Code announcements.
- Local rent/contract reminders run approximately daily via WorkManager, based on the latest offline app snapshot. Timing is not exact and Android battery rules may delay.
- Serverless owner notifications: authorized GitHub writers can use **Actions > RentTrack Owner Notification Broadcast > Run workflow**, entering title and message. Workflow publishes a signed-in-owner-controlled notice JSON to GitHub Pages; opt-in RentTrack APKs poll on startup and periodically (~30-minute request cadence, not a delivery guarantee).
- Optional FCM integration also compiled into app, using Firebase Messaging topic `futurecode_renttrack`. This only works when Android Firebase app `studio.futurecode.renttrack` is correctly registered and all GitHub Actions `FC_FIREBASE_API_KEY`, `FC_FIREBASE_APP_ID`, `FC_FIREBASE_PROJECT_ID`, `FC_FIREBASE_SENDER_ID` build variables are present. The existing Future Code PushDesk admin sender must also have its Firebase service account backend configured to send FCM messages.
- Serverless feed needs no Firebase and never receives tenant data. Only the owner-authored announcement title/body is public.

## Production validation
GitHub Actions renttrack-android-build.yml runs billing, payment and encrypted-backup test cases and compiles Debug+unsigned Release. renttrack-publish-signed.yml handles permanent signing, APK certificate/hash, website upload and update manifest. Official release is not equivalent to a real-device-tested app: verify Android 9, 13 and recent Android versions; notification permission, offline reminders, website notice, update from an already signed earlier version, download/installer, export/restore.
