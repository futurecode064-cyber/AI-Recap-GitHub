# Future Code AI Tools VPN-free mirror — pending host deployment

**Problem:** The current `https://futurecode064-cyber.github.io/AI-Recap-GitHub/ai-tools/` uses GitHub Pages, which the owner reports requires a VPN on Myanmar networks. Do NOT claim changing client-side code on that site changes its CDN transport.

**Known existing user gateway**: `https://future-code-app-downloads-064.cheeky-elf-5504.chatgpt.site/myanmar-kyar/`. It was used for the user's earlier download website. Do not replace its `/myanmar-kyar/` path, alter its hostname, or create a new separate hostname without permission.

**Required additional route:** `/ai-tools/` on that existing site. This path **has not been created** by this repository, as GitHub credentials do not grant access to the chatgpt.site hosting control plane. Its real URL is **not verified live** until an authorized editor deploys the attached package into the existing site.

## Implementation steps in the EXISTING gateway host (not on GitHub Pages)
1. Export latest static payload via GitHub Actions `ai-tools-gateway-package.yml`, or run `python scripts/package_ai_tools_gateway.py` in repo root. The ZIP contains files under `ai-tools/`.
2. Add static route `/ai-tools/*` to the existing `future-code-app-downloads-064` hosting project, **without modifying or redirecting** the existing `/myanmar-kyar/` route. Serve the ZIP's `ai-tools/index.html` at `/ai-tools/`, and its adjacent files under that prefix.
3. Set `Content-Type: application/json` on `tools.json`, `updates.json`, `android-version.json`, `link-health.json`; serve JS as JavaScript and CSS as text/css.
4. Never 302/redirect assets or users to `github.io`, `pages.dev` or `workers.dev`; the whole goal is to eliminate those runtime dependencies for the directory. For updates, sync the static payload when catalog revision changes.
5. Verify from Myanmar with VPN OFF on **two different networks** (mobile data and Wi-Fi), including /ai-tools/, search, tool detail, and downloaded /ai-tools/tools.json. Also verify that /myanmar-kyar/ still works.
6. Android v1.0.1-offline has `UPDATE_FEED_URL` already targeting this planned `/ai-tools/` route and stores validated JSON privately for later offline use when the route becomes live; native app loads bundled catalog regardless.
7. Do not advertise background push/automatic APK installs: Android WorkManager checks periodically; push at app-closed/instant requires an authorized sender and Android installs require user permission.

**Validation limitation:** External GitHub Actions success is not a Myanmar ISP VPN-off acceptance test. Only end-user devices can establish that.
