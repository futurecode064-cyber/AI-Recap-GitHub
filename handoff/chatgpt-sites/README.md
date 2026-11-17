# Existing ChatGPT Sites — Myanmar Kyarkwat v4.2.26 handoff

These files are **prepared only**, not deployed to ChatGPT Sites. Apply changes to existing projects; never replace with a new domain.

1. Existing app download detail page: https://future-code-app-downloads-064.cheeky-elf-5504.chatgpt.site/myanmar-kyar/ — replace the existing page using `myanmar-kyar/index.html` (copied from the live HTML and updated minimally).
2. Existing app catalogue: https://future-code-app-downloads-064.cheeky-elf-5504.chatgpt.site/apps/ — replace **only** Myanmar Kyarkwat's card with `apps/myanmar-kyar-card.html`. Preserve all other app cards and script integrations.
3. Existing VPN-free gateway: https://future-code-kyar-connect.cheeky-elf-5504.chatgpt.site/app-update.json — update its existing manifest/handler to match `kyar-connect/app-update.json`, with no-store caching. Preserve current /api, /auth/*, /health and /updates/* handling.

Signed APK verified reachable at https://future-code-kyar-connect.cheeky-elf-5504.chatgpt.site/updates/Myanmar-Kyar-v4.2.26.apk : size=1,778,475 bytes, sha256=72fe88fb6ba4d2b4232e0a4bf54be19ab5f3425eed6b791ab25a7336c1e301d1, package=mm.futurecode.myanmarkyar, versionCode=40226, original signing certificate maintained.

Verify all three existing URLs after publishing; page, catalogue and JSON must show 4.2.26, download must return verified bytes. Confirm VPN-free in-app update on an existing Android install. Do not alter existing account, wallet, rating or tournament data or OAuth secrets. End-to-end Google OAuth consent on physical device remains unverified.
