# Future Code Chinese · v1.0.0
Android package: `mm.futurecode.chinese`; minSdk 26, Java 17, no third-party SDK.
Myanmar-first Mandarin starter pack: 6 stages, 24 units, 120 phrases; not professional fluency certification.
TTS via Android installed Chinese voice; speech-to-text via installed Recognizer service (some services use network). Offline content, localStorage progress, hand-drawing practice, multiple-choice quiz.
GitHub Actions builds signed APK through the existing private Future Code signing service, and publishes the immutable GitHub Release `chinese-learning-v1.0.0`. Never reuse a changed signing identity for later versions. The app update check reads `portal/apps/chinese-update.json` and opens a trusted GitHub Release download; Android requires user install approval.
Owner notification messages come from `portal/apps/chinese-notifications.json` (id/title/message); increment the id to deliver a new notice when the OS runs the daily network job. This is polling, not instant FCM push. Android 13+ notification permission is requested by Settings > Notification.
Website download analytics is click-based and uses the existing `portal/apps/stats.js` Supabase RPC with stable app key `chinese-learning`, not the count of completed device installations.
To extend the curriculum, edit `app/src/main/assets/course.js`, bump `versionCode` and `versionName`, update APK workflow tag/version and `portal/apps/chinese-update.json`, then rebuild/release. Do not represent the introductory 120 phrases as complete professional proficiency.
