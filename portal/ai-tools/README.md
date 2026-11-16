# Future Code AI Tools v1.0

Independent directory module in `portal/ai-tools/`. Existing APK/Student/Football systems untouched. GitHub Pages `future-code-portal-pages.yml` publishes the whole `portal/` folder.

**Working:** 61 curated tool links, 13 functional categories, one tool may belong to many categories; search, price filters, favorites, compare (3 max), local PWA installation, cached offline shell and catalog. New `tools.json` changes are fetched on tab focus/every 5 minutes; increment revision in BOTH tools.json and updates.json to trigger an opt-in browser Notification (only when the app is open/active).

**Limitation:** The existing Web Push event listener is just a delivery handler. True push while app is CLOSED needs separate push subscription, backend storage, VAPID secrets and sender. Do not claim remote push completed. Native Android APK builds, stable signing, Android OS notification permission, and Android binary auto-updates are not included in this first web pilot. APK silent-install is not supported for a normal Android app; store/update UI permission needed.

**Update:** Edit `tools.json`, increment its revision, edit `updates.json` matching revision/notes and commit; the website auto-syncs on next check without APK reinstall. Official URLs only; pricing varies, verify with provider. Future native app package planned `mm.futurecode.aitools`. Keep each app separate when possible; move this module to dedicated repo once repository creation access is available.
## V2 Cache & listing fixes (2026-11-16)
- Stale PWA cache replaced with network-first, versioned cache supporting the active app-v2.js and styles-v2.css. Offline fallback uses same-origin cached assets only.
- Pagination removes the previous Load More control before inserting current remaining count (prevents stale click targets).
- HTTP connectivity may vary by Myanmar ISP; GitHub Actions 125-link batch is external verification, not evidence of local reachability.
