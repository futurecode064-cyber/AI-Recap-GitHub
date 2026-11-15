# Future Code AI Tools — Roadmap / Operations

Live path: https://futurecode064-cyber.github.io/AI-Recap-GitHub/ai-tools/

## V1.0 — Category 30, 150–300+ sources, search, filters, detail page, admin
- 30 functional category taxonomy, 61 hand-curated AI web apps plus selected sources from the independently-maintained Archestack Best of AI.
- GitHub-owned admin dashboard at /ai-tools/admin/ with Catalog Editor and moderated GitHub Issues. No shared browser-side admin secrets.
- Deep links: #/tool/<tool-id>; 48-item pagination and advanced text/field search.

## V1.1 — Favorites, Comparison, Submission, Myanmar descriptions
- Local favorites, compare up to 3 tools, GitHub issue submission (requires GitHub login).
- Curated core tools have Burmese descriptions; imported open-source descriptions appear in original English until independently translated. Do not claim full Burmese translation of all sources.

## V1.2 — 500+, Link Health, Recommendations
- Daily rotating bounded external link checks. External status is not Myanmar ISP accessibility proof.
- Category/favorites-based deterministic recommendations computed locally, no profiling data sent to server.
- Source-reviewed listing is **not equivalent** to an independently verified accessible URL. Only show "Link checked" after monitoring HTTP 2xx/3xx.

## V2.0 — 1,000+, Advanced Search, User Collections, Automation
- 1,200 listings from hand-curated entries + an open-source directory catalog.
- Private-on-device named collections, JSON import/export. Cross-device account sync not implemented.
- Watch categories; app checks catalog on focus or while visible every 5 min. Android WorkManager worker checks about every 6 hours (subject to battery restrictions), alerts on catalog revision.
- Daily GitHub Actions: source sync + link health batch + tests + publish. New revision only for changed tool info, so notices don't fire daily without content changes.
- Background Web Push when browser is closed is **not** working until a push-subscription storage/sender service is added. There is a service worker push handler only.
- Native APK is a **debug beta** build, not production-signed. Release requires stable private signing certificate and user-consent updates.

## Data & attribution
Third-party open-source listing data adapted from Archestack (https://github.com/archestack/best-of-ai), under Creative Commons Attribution 4.0: https://creativecommons.org/licenses/by/4.0/. Original dataset license text credits Archestack (https://github.com/archestack/best-of-selfhosted-ai). No affiliation/endorsement implied.
A tool listed does not imply its code, safety, current pricing, or availability was audited by Future Code AI Studio. No automatic removal for temporary 403/429 or network timeout.
Never commit secrets or expose a GitHub token in the static website.

## Release verification
Run workflow \`.github/workflows/ai-tools-sync.yml\` via GitHub Actions. It downloads current source, validates 30 categories and >=1000 usable linked listings, runs baseline portal tests, commits only generated catalog files, and deploys the existing whole portal.
