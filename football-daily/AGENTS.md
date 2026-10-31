
## Permanent kickoff time format — owner correction 2026-10-31
- Every public website, sub-brand, odds table, match preview/result, frame/PNG and downloaded image MUST show Myanmar-local match times in **12-hour English AM/PM**, e.g. `19:00 → 7:00 PM`, `01:30 → 1:30 AM`, `00:00 → 12:00 AM`, `12:00 → 12:00 PM`. Never show raw `HH:mm` in public-facing time cells.
- Keep source and machine fields `sourceKickoff`, `kickoff` and `kickoffUtc` canonical and accurate (24h/ISO); **format only at display/export boundaries** using the shared `window.FutureCodeTime.clock(match)` helper from `football-data-client.js`. Do not modify match hours to fit formatting or infer unsupported kickoff times.
- For after-midnight matches, retain their **actual Asia/Yangon calendar date** in `kickoffCalendarDate` / `kickoffDate`, separate from `nightEditorialDate` and report date. `FutureCodeTime.full(match)` is for exact-date tooltip/metadata; visible narrow time cells show clock only. Do not roll 1:30 AM back to the previous calendar day.
- Maintain/regression-test `football-daily/tests/time-format-12h.test.cjs` and `football-daily/tests/odds-clock-all-brands.test.cjs` on every future daily publication. Do not revert versioned HTML to legacy HH:mm format.

> **ACTIVE OWNER UPDATE 2026-10-28 — V7:** Read `football-daily/docs/DAILY_PUBLICATION_V7.md` (relative to repository root) first. Current owner says preserve today's main website system. PDF + “ဒီနေ့အတွက် လုပ်ပါ” authorizes complete morning publishing. The V7 contract overrides historical draft-only, manuscript-required, D1/static and paragraph-count conflicts. Run `daily_package_guard.py` on candidate resources and verify every live section and real downloads before COMPLETE. Master prompt: `football-daily/docs/DAILY_PDF_MASTER_PROMPT_V7.txt`.

# Future Code Football Daily — ACTIVE OWNER CONTRACT (2026-10-28)

This file is the standing daily publishing instruction for the EXISTING six-brand project. **Not a ChatGPT scheduled task, new site, database, paid API, or autonomous background agent.** When the owner provides a morning Myanmar odds PDF and says to publish today's football content, read this file and the named references and run that day's publication using available connected tools. Do not ask the owner to repeat permanent rules. Never falsely claim work happened if tools cannot perform it.

## Reference priority
1. Latest explicit owner instruction, current uploaded PDF, supplied article text and Special Choice.
2. [docs/master-prompts/DAILY_ONE_SHOT_V6_2026-10-27.md](docs/master-prompts/DAILY_ONE_SHOT_V6_2026-10-27.md) — original owner one-shot V6.
3. [docs/master-prompts/MYANMAR_MATCH_PREVIEW_MASTER.md](docs/master-prompts/MYANMAR_MATCH_PREVIEW_MASTER.md) — owner Burmese football journalist master.
4. [docs/master-prompts/DAILY_FOOTBALL_NEWS_TOP10.md](docs/master-prompts/DAILY_FOOTBALL_NEWS_TOP10.md) — owner football news master.
5. [docs/DAILY_TIPS_POLICY.md](docs/DAILY_TIPS_POLICY.md) — independent VIP Internet / Bookies / AI Tips methodology.
6. Existing approved design rules and runtime-verified data schemas.

**Input rule:** The user's current-day PDF alone is sufficient to start a FULL MORNING UPDATE. If article drafts accompany it, match them to fixtures by ID/teams/date and preserve author text verbatim. If the owner supplies only the PDF, research and **write fresh match previews** in the journalist master style. Never fill missing source-provided text by copying an old day's prose. Explicit current-day choice and count override default two Special Choices.

## Discover true live source before modifications
Canonical source reference: futurecode064-cyber/future-code-football-daily:main.
Current observed Pages production source: futurecode064-cyber/AI-Recap-GitHub:football-daily-render, folder football-daily/.
Production: https://future-code-football-daily.pages.dev/
Six public routes: /, /ykz-family/, /bw-sport/, /ko-thet-family/, /future-code-journal/, /kmm-sport-hub/.
Check latest HEADs, current actual Pages deployment, football-engine-config.js, live HTML/scripts/JSON and active Workers/D1 reader before publishing. When FC_FOOTBALL_ENGINE.enabled=false, data is static Pages JSON: D1-only publish will NOT update live pages. Never overwrite newer production data with an older main branch. No new site or database, redesign, brand change, payment requirement, secrets exposure, force push or unrequested scheduling.

## Full morning workflow — Asia/Yangon
1. Capture PDF pages and source row ledger: actual date, page, row, published fixture ID, league, full Burmese names, verified home/away orientation, local kickoff (after-midnight night-date rules), original upper team, original body and goal-total Myanmar odds. Preserve printed glyphs, +, -, =. **Retain all PDF odds rows; do not invent missing previews for ineligible rows.** The number of odds rows and preview-eligible rows may differ (e.g. observed 27 vs 18 on 2026-10-28), but each eligible preview must match its actual odds fixture.
2. Research each eligible fixture using official competition/club reports and reputable score providers. Verify team and league crests (also actual PNG), 1X2 quoted from one source/snapshot, last five *completed official* matches for each team, W/D/L, current season standings/points/played/W+D+L, meaningful tactics, current manager, real players and confirmed injuries. Never fabricate uncertain details. Keep provenance URLs and data dates.
3. Prepare every new Burmese preview as one coherent, professionally edited match-specific football journalist paragraph following the uploaded journalist master, named opponents and final team-specific selection, **unless owner-authored text supplied**; then copy exactly. Special Choice: 2 by default, user-specified 2–5 when requested; professionally sourced analysis, no predicted exact score or trailing warning, end '[team]ကို ရွေးပါတယ်'.
4. Original Myanmar odds from morning PDF -> "မူလ". "ယခု" stays blank until current/evening source supplied. For current-odds-only request, update *only* corresponding same-date matched "ယခု" fields. Keep odds, 1X2 and internet score predictions separate.
5. Yesterday's results: check only previous editorial night's verified completed fixtures and final status; never turn pre-match predictions into full-time results.
6. Tips each morning (no owner re-explanation): VIP Internet -> independently search externally published **exact score** for that particular fixture and preserve link, source/date/teams; no unsourced score. Bookies -> separately calculate probable score from **actual current verified 1X2 implied probabilities**, Myanmar Asian handicap and goal-total line; label as inference, never an official bookmaker score quote. AI Tips -> independent existing last-five/current season Poisson model output. Three columns must be exactly "VIP Internet", "Bookies", "AI Tips" on-screen, mobile, single PNG, all-fixture PNG and ZIP exports. They may happen to agree but must not be copied from one another. Missing credible input -> "—" rather than invented output. Never call an internet/PDF prediction an AI model output. Use data/tips/YYYY-MM-DD.json source ledger.
7. News: research the newest relevant 10 football news items, prioritized 24 hours then 48, professionally rewritten in Myanmar Unicode following the uploaded news master. For each item retain original event/reporting date, primary article URL, licensed image URL/credit or source page when reuse unverified, women’s sports item as specified. News appears Main + Goal Zone only.
8. Update shared production data/asset mappings without deleting previously approved frames, logos, brand styles or downloads. Publish verified package only to the CURRENT confirmed live writer. Do not treat a GitHub commit as proof of live deployment.
9. Validate PDF source row ledger against all published odds rows, preview-eligible fixture coverage, source/website article fidelity, 1X2/last-five/standing, real logos in saved PNG, tips provenance, yesterday FT, choices, news licensing, desktop/mobile and all SIX branded sites. Check downloaded PNG/ZIP opens, and every distinct image's intended rows exist. Critical mismatch -> do not publish erroneous part. Report partial/blocked truthfully.

## Frame Editor and Download Center
Main-only frame library remains editable (add/edit/remove assignment/color/banner), stored in browser IndexedDB with backup/import; do not claim that browser-only edits automatically sync to every device.
Section-specific persistent output layout applies even when selecting ALL sections + ALL frames + ZIP.
- Odds: all in 1 PNG; all split into 2 PNGs; **2 matches per PNG** (different from splitting the entire set into 2 images); by league.
- Previews and Special Choice: 1 match per PNG or 2 matches per PNG.
- Results: all in 1 PNG; all in 2 PNGs; 2 matches per PNG; by league.
- VIP/Bookies/AI: all in 1 PNG; all in 2 PNGs; 2 matches per PNG; by league.
- News: 1 item per PNG or 2 items per PNG.
- Preview must render a real selected fixture and frame, show actual PNG and provide functioning PNG download; ZIP should contain only selected frames and matching content. Failure must display specific reason; no mocked-success placeholder.
Brand clones keep existing visuals. No unsupported backend/image-processing changes.

## Operational truth
A repository Markdown prompt is a permanent rule for future agent-led runs, **not a cron crawler or AI execution engine**. Running fresh web research, OCR/PDF extraction and original AI editorial writing still requires an invoked connected agent or an explicitly provisioned execution service; GitHub Actions alone does not create a free always-on AI. Never create ChatGPT scheduled tasks to mimic this request.

## Permanent daily download-format gate — owner confirmed 2026-10-28
Apply the corrected 28 October export layout on EVERY daily update, including Main, Bet City Family, Goal Zone, YKZ, BW Sport, Ko Thet and KMM. Preserve each brand's existing banners and palette.
- Keep each league heading once in its own header; never paint it over column headers or fixture rows. Retain the absolute native-canvas transform regression.
- Resolve ALL team and competition crest URLs for the candidate day's report, odds and results to verified bundled images. A previously cached day's coverage is not sufficient. Add new clubs and competitions to both main and brand mappings before publication; never use unrelated crests or silently accept blank tiles.
- Check Myanmar shaping, long team/league labels, full article text, aligned columns, HH:mm odds clocks, intact original/current prices and undistorted top/bottom banners.
- Run current-day asset coverage and native-label tests, then exercise real PNG downloads on desktop and mobile. Check all-in-one, both split parts and league-selected outputs; previews/results and existing ZIP modes must retain their selected content.
- Visually inspect downloaded images, especially lower-division cup teams and long names. After publishing, verify actual live downloads across all six clone sites. A commit, successful HTTP response or PNG signature alone does not certify layout or complete logos.
This is a persistent release-quality rule for invoked daily publishing, not a newly requested scheduled task.

## Download Center owner update 2026-10-29
- ZIP uses one Unicode folder per section; do not flatten to PNG-Images. Duplicate frame filenames are resolved within each section.
- Original artwork ribbons use their source width/height (or original full-frame crop) ratio, independent of daily fixture count. Never stretch every built-in banner into a shared fixed height.
- When repainting native Myanmar league labels, hide only text in the html2canvas clone using transparent text; visibility:hidden also removes the cell background and makes white lettering disappear.
- Keep export table rows/cells height:auto and min-height:0 so screen/mobile card heights cannot inflate PNG tables.
- Run frame-banner-ratio, frame-multi-selection and frame-studio-export regression tests and inspect real PNG/ZIP after format edits.

## OWNER PERMANENT DAILY EDITORIAL / SECTION COMPLETENESS CONTRACT — 2026-10-29
The owner's exact professional Burmese journalist prompt is `docs/master-prompts/MYANMAR_MATCH_PREVIEW_MASTER.md`. **Never silently substitute** the former repetitive data-led manuscript style or a generic AI summary. Each standard preview is an original, fluent, coherently connected ONE-PARAGRAPH Myanmar football journalist analysis with a grounded named team selection; no unsupported manager, injury, player, score or odds text. No generic "ပြိုင်ဘက်" where the other team's actual name works. Read `docs/master-prompts/SPECIAL_CHOICE_EDITORIAL_STANDARD.md` and write exactly TWO substantially more complete, better researched and more insightful **premium** Special Choice articles separately. Their `specialAnalysisParagraphs` field contains a single natural premium paragraph; the usual `dailyPreviewText` remains the standard preview. **Editorial-only rewrites may be staged in research but must not replace live prose without the owner's separate publish authorization**, as the supplied master explicitly requires.

**Every daily publish must have visible functional Main sections, not blank headings:**
- `VIP Internet / Bookies / AI Tips`: Every fixture row must render three source-separated result CELLS. Bookies must compute from independently sourced 1X2+goal totals and AI Tips from verified form/season model. The VIP cell displays a sourced date-matched third-party exact-score tip **or an explicit unavailable indicator with explanation**; never copy a PDF internet guess and never fabricate a score to fill a gap. A blank UI, invisible score cell, missing date-scoped tips file, or model runtime error fails QA. Confirm downloaded PNG matches the visible three-score grid.
- `ပွဲစဉ် ဖြစ်နိုင်ခြေ (%)`: Use the ACTIVE static Cloudflare `data/today.json` + `data/odds/YYYY-MM-DD.json` when D1 is disabled; do not require a disabled D1 worker/manifest. Calculate independently sourced conditional home-v-away (sums 100) and model 2.5 goal over/under (sums 100). Each published eligible match must display nonblank percentage cells, date and relevant source/method, or a visible explicit unavailable reason. Do not invent percentages.
- `ဘောလုံးသတင်း`: Ten newest, dated and genuinely relevant stories, Main and Goal Zone. **Each needs a distinctive topic-matched visual** and proper image caption/author/license/source provenance. Prefer an authorized current event photo; if license is unverified, use a verified reusable contextual archive photo with the true archival label, or a distinct original relevant editorial illustration labeled honestly. Never silently publish a news card without its image, invent an event photo, repeatedly reuse one stock photo, or let third-party HTTP 403/429 silently remove the image. Prefer same-origin cached assets for Canvas/PNG exports; verify both card image and real PNG download.
- `Main AI poster PNG`: The uploaded artwork's original top and bottom banners retain their native aspect ratio. Draw all data strictly within the source frame safe zones; never paint an opaque table/header over top artwork, distort the original banner or stretch the frame indiscriminately for long fixture lists. Inspect real full-size browser-generated PNG for every built-in AI frame and ZIP after format changes.
- Automated checks must validate report row counts, source IDs, score provenance, date, percent coverage, ten news visuals with licenses, successful image loads and actual browser Canvas PNG and ZIP. Fail visibly rather than reporting COMPLETE on only a GitHub commit or a HTTP 200.

These GitHub instructions are durable release gates for *invoked* daily updates, not an always-on autonomous crawler or a claim that all external tips/photos will always exist.

## Completion gate reconciled 2026-10-29
- Use the current one-paragraph premium Special Choice standard; never reintroduce an obsolete minimum of two/four paragraphs in guards or tests. Preserve article sources separately.
- Recheck the actual fixture-specific 1X2 page on publication day. Keep publisher snapshot date/time separate from oddsVerifiedDate (the actual check date); never advance a verification date without reading the prices. Run the probability model on every candidate row and require coverage counts.
- Search external fixture-specific exact-score publications for every VIP row before declaring it unavailable. Keep external source/date/check date and orientation; do not use local Bookies/AI/PDF scores to fill VIP. Log unavailable reasons explicitly.
- Require all ten news images with credit, license/context, caption and a working image file. Label original illustrations as illustrations; never describe them as real event photographs.
- Completion requires current normal/premium prose actually visible live plus nonblank probability/tips coverage and real PNG/ZIP QA. A saved draft alone is unfinished.
