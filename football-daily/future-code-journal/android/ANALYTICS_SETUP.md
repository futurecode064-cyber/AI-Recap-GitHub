# Goal Zone APK — daily visitor & download analytics

Scope: **only** `/future-code-journal/android/`. Do not enable analytics on the main football, BW Sport, YKZ, or Ko Thet sites.

## What has been built
- `index.html` sends one anonymous page-view request on page load.
- The existing `GoalZone_Sports_Journal_v1.0.1.apk` download URL stays exactly the same, so existing QR links and in-app updates are not broken. The Cloudflare Pages advanced worker logs **successful full-file APK GET requests**. HEAD, Range and obvious crawlers are not counted.
- `/future-code-journal/android/stats.html` is an owner-only dashboard. Authentication uses the existing Future Code Main session, with login redirect and a signed cookie.
- Statistics: page views, approximate unique browser visitors, APK download requests, daily date breakdown, APK version/file breakdown, countries, recent request times; 1/7/30/90 day filters using `Asia/Yangon` dates.
- The site records random first-party anonymous browser IDs hashed by the Worker, visit/download category, date, country code, and timestamp; no downloader names, phone numbers, email addresses, or raw IPs.
- Counts are created from the time the database is bound; they are not retroactive. Downloads are not verified installations. Different browsers/devices can count as separate unique visitors.
- Without a D1 binding the public APK continues working, while the dashboard returns a clear setup message.

## One-time Cloudflare dashboard setup (free tier)

1. Open https://dash.cloudflare.com/ and select the Cloudflare account hosting **future-code-football-daily**.
2. Open **Storage & Databases → D1 SQL database** and create a database named `goalzone-analytics`. No SQL editor action is required: the Worker creates its table automatically on first tracked request.
3. Open **Workers & Pages → future-code-football-daily → Settings → Bindings** (select Production).
4. Choose **Add binding → D1 database**. Set the **Variable name** exactly `GOALZONE_ANALYTICS_DB`; select the existing `goalzone-analytics` database and Save.
5. Confirm that this Pages production project already has both encrypted secrets `FCD_MAIN_PASSWORD` and `FCD_SESSION_SECRET` required for the existing main-only secure login. Never add secret **values** to GitHub, public files, or a chat.
6. Redeploy the production Pages project after the GitHub source changes are mirrored. Binding changes require redeploy.
7. Open `https://future-code-football-daily.pages.dev/future-code-journal/android/` and refresh. Download the APK once as a test.
8. Visit `https://future-code-football-daily.pages.dev/future-code-journal/android/stats.html`. Sign in to the existing owner login when redirected. Pick **Today**, **Last 7 days**, or **Last 30 days**, then **Refresh**. Check the counter.
9. Optionally enable **Cloudflare Web Analytics** under this Pages project to see wider site metrics through the Cloudflare dashboard; this is separate from this Goal Zone-only counter and should not be conflated.

## Production sync note
The live Cloudflare Pages project historically deploys from `futurecode064-cyber/AI-Recap-GitHub`, branch `football-daily-render`, rather than this repo's `main`. Ensure the desired changes to `_worker.js`, `future-code-journal/android/index.html`, and `future-code-journal/android/stats.html` reach the **actual Pages production source**. Do not unintentionally sync other pending football editorial or brand changes. Confirm on live before claiming that analytics works.

## Protection and limitations
- `/future-code-journal/android/stats.html` and `/future-code-journal/android/api/stats` require the existing owner's signed session. Stats may not be viewed by visitors.
- Anonymous hash via `FCD_SESSION_SECRET`, a 1-year first-party visitor cookie, and no raw IP storage.
- Distinct browser visitors are estimates. Bots, disabled JavaScript, cookies blocked, cached/CDN requests, cancelled downloads, and APK resumptions can cause undercounting/overcounting.
- The current dashboard records requests and not completion of APK installation. Android PackageManager installs are not visible to a public download webpage.
- If the D1 binding is removed, downloads continue; no statistics will be stored during the outage.
