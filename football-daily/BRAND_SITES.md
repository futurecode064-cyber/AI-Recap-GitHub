# Future Code Football — multi-brand shared daily publishing
Updated: 2026-10-12
Approved format source of truth: [DAILY_APPROVED_FORMAT.md](./DAILY_APPROVED_FORMAT.md)

## Current production structure
* Main Future Code Football Daily: `/` / `odds.html`
* First branded website: **YKZ FAMILY GROUP**, slogan **အတူရှေ့ဆက် YKZ** at `/ykz-family/` and `/ykz-family/odds.html`
* Branded logo: `ykz-family/assets/logo.webp`, derived by cropping/optimizing the exact user-supplied YKZ FAMILY logo (no replacement mark).
* YKZ branding only: `ykz-family/brand.css` and `ykz-family/brand.js`; pure scarlet red (#e00000) + gold (#ffcf58) + charcoal black (#111111). The root website keeps its original teal colors.
* Two branded HTML entrypoints reuse `../app.js`, `../odds.js`, `../styles.css`, `../canvas-image-kit.js`, `../card-export.js`, and `../daily-image-export.js`. There are **no cloned football data JSON files**.

## SINGLE SOURCE OF TRUTH — DO NOT DUPLICATE
* Today match previews: `football-daily/data/today.json`.
* Yesterday and older final results: `football-daily/data/archive/YYYY-MM-DD.json`.
* Dated Myanmar odds: `football-daily/data/odds/YYYY-MM-DD.json`.
* Optional verified fixture-only fallback snapshots: `football-daily/data/fixtures/YYYY-MM-DD.json`.

YKZ main page has `data-football-data-url="../data/today.json"`. The *shared* `app.js` resolves yesterday relative to that root data folder. Its odds page has `data-football-odds-data-url="../data/odds/"`, which the same shared `odds.js` uses. Consequently, one GitHub update to the central JSON causes BOTH sites to show the newly published content after Cloudflare Pages deploys the production branch, without touching any brand file. No API key or paid service required.

## How to add future brands
1. Copy **only** `ykz-family/index.html`, `ykz-family/odds.html`, `brand.css`, `brand.js`, logo and any brand-only media into `football-daily/<brand-slug>/`. **Do not copy core JS or data/**.
2. Set a unique page title, brand name, favicon and logo, slogan, color palette in CSS and brand.js. Preserve `../data/today.json` and `../data/odds/` URL bindings.
3. Keep the exact approved preview, desktop odds, results and download formatting; do not regenerate them differently for different brands. A brand may choose a separate palette and visible brand text.
4. For branded Canvas PNG set `data-football-brand-name`, `data-football-brand-slogan`, and let brand.js resolve `data-football-brand-logo-url`. Shared exporter uses YKZ brand palette and filename where configured. For other brands a generic palette map can be extended without editing the data model.
5. Add tests modeled after `tests/ykz-brand.test.cjs`, including logo magic bytes and single shared data path. Run `node --test football-daily/tests/*.test.cjs` and the daily guard.
6. A separate pages.dev **hostname** or purchased custom domain is optional; using the existing Cloudflare Pages project, each `/<brand-slug>/` is already a distinct branded entrypoint on the same host. Creating another Cloudflare project or domain requires that account's deployment permissions, not just GitHub repository access.

## Daily operational workflow (unchanged)
6 AM Yangon: scheduled assistant research/preparation and notification; NO automatic publish. User explicitly approves GitHub publication. Commit today's approved data and its dated odds **once** to `futurecode064-cyber/future-code-football-daily` branch `main`; the guarded legacy-repo mirror transfers that update to the original Cloudflare Pages production branch. Both root and YKZ use it. Avoid fabricated data; PDF last-column internet predictions are not verified final scores.

## Notes
- Do not serve the YKZ files under a duplicate separate root with local `data/` copies; that would break synchronized updates.
- Do not replace the fast Canvas export with slow DOM screenshots.
- Google/ISP restrictions on `pages.dev` in Myanmar still depend on the user's mobile network. Multiple branded paths on the same domain share this network limitation.


## Match hero / WDL visual contract (user update: 2026-10-13)
The user approved redesigned match cards with a full two-team hero, correct logos, three-cell team/match/kickoff band, Myanmar opening-quote strip, Home W/D/L five-result badges | bookmaker 1X2 | Away W/D/L five-result badges, no visible historical H2H and a more readable full Burmese preview paragraph. Full PNG exports reproduce that layout without clipping. This supersedes old H2H panels and previous canvas poster layouts.
Photo URLs (homeHeroImageUrl, awayHeroImageUrl) are optional for verified team photos with appropriate rights; without them, draw branded illustrated kits + genuine crests. The shared app.js and card-export.js must always serve BOTH root and /ykz-family/, while brand.css overrides only YKZ colors and its actual YKZ FAMILY logo/slogan. Never create duplicate per-brand data JSONs.


## BW SPORT ဘောလုံးဂျာနယ် — launched 2026-10-13
- Public branded home: https://future-code-football-daily.pages.dev/bw-sport/
- Public all-match Myanmar odds: https://future-code-football-daily.pages.dev/bw-sport/odds.html
- Main canonical source: football-daily/bw-sport/index.html and odds.html.
- Real user-uploaded original BW Sport metallic soccer/chart symbol: football-daily/bw-sport/assets/logo.webp (web-optimized original uploaded logo, not an AI replacement).
- Exclusive theme: football-daily/bw-sport/brand.css, brand.js. Colors: #06162d deep navy, #0b74ef cobalt/electric blue, #3ec1ff sky-blue neon, #ddecfc metallic silver. No tagline or slogan: removed from all BW pages, brand metadata, graphic assets, and saved PNGs by user request.
- Shares root football-daily/data/today.json, data/odds/YYYY-MM-DD.json, archive and results, root app.js, odds.js, card-export.js, daily-image-export.js, canvas-image-kit.js, and original special-choice editorial rules. NO duplicated data/ folder or separate schedule.
- Custom blue Canvas PNG identity, original logo in header/favicons/export, and Special Choice content. Keep no-H2H and crest-only match hero rule from current DAILY_APPROVED_FORMAT.md.
- Original Future Code, YKZ FAMILY GROUP and BW SPORT are independent site looks but share one single source of football facts, odds, and dates. When publishing validated daily data, all three must reflect the new report automatically.
- The base domain is unchanged; Myanmar ISP/VPN reachability of Pages applies identically to all branded paths. Do not promise that a new branded subpath works without VPN if the parent domain is blocked.
