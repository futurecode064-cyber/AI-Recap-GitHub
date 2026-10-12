# FUTURE CODE FOOTBALL DAILY — APPROVED DAILY FORMAT (LOCKED)
Version: 2026-10-12 10:30 MMT
Status: USER APPROVED — DEFAULT FOR ALL FUTURE DAILY REPORTS

> This is the authoritative DAILY DESIGN, RESEARCH and EXPORT contract. It supersedes conflicting old README/RESEARCH_STANDARD history (old six-league scope, automatic publishing, tomorrow tab, original DOM screenshot exporter, old canvas layout). Do not redesign or change this format without an explicit new user request. All dates use Asia/Yangon.

## 1. Daily operating agreement
- 06:00 AM Asia/Yangon: ChatGPT scheduled task RESEARCHES and PREPARES data, validates it, and notifies on completion (or explicitly reports gaps). Preparation only: NO automatic GitHub write/push/deploy.
- Wait for the USER to say **"GitHub မှာ တင်ပေးပါ"** (or an equally explicit instruction) before updating the published repository. Preserve report for publishing if possible, and refresh time-sensitive scores/odds when finally publishing.
- No paid Football API and no AI API key. Verify from reputable permitted public official football sites, results, standings, ESPN, AiScore and LiveScore as accessible; sources may be unavailable. No invented numbers.
- On approval: use authoritative repository `futurecode064-cyber/future-code-football-daily`, branch `main`, folder `football-daily/`; a separately guarded GitHub Action mirrors approved changes to the existing Cloudflare production repository `futurecode064-cyber/AI-Recap-GitHub`, branch `football-daily-render` without changing public URLs; preserve previous report in `data/archive/YYYY-MM-DD.json`, source changes in `data/today.json` and `data/odds/YYYY-MM-DD.json` when available. Check file SHA before write, audit and read back; confirm GitHub commit and ideally Cloudflare live data before claiming website live.
- Once a daily source file/PDF arrives, use that day's match rows and Myanmar football team spellings as the canonical displayed labels. Use distinct English canonical names/IDs only for source matching/crests. Check ambiguous old-font/team spellings before publish. If the file is absent, do not fabricate a Myanmar opening-price sheet; clearly flag that data as pending.
- For PREVIEWS, use the intersection between the user's provided daily match list and the approved competition set if a daily list is supplied. Do not automatically analyze matches outside the provided list merely because a league has games. Verify every fixture and its Myanmar-local date. If no list is supplied, prepare verified eligible matches per the scheduled brief, but ask for/select the intended match list before claiming full list coverage.

## 2. Supported competitions
Domestic league: Premier League, Championship, League One (England), La Liga, La Liga 2, Serie A, Serie B, Bundesliga, 2. Bundesliga, Ligue 1, Ligue 2.
Domestic cups: FA Cup, EFL/League Cup, Coppa Italia, Copa del Rey, DFB-Pokal, Coupe de France.
Europe: UEFA Champions League, UEFA Europa League, UEFA Conference League.
International: UEFA Nations League (country teams; **not** English fifth-tier National League), FIFA World Cup, FIFA World Cup Qualifying, UEFA Euro, UEFA Euro Qualifying.
The league/cup filters show **only competitions actually present in the selected day's published match data**. Hide competitions with zero matches. Special Choice tab only if a justified, verified selection exists.

## 3. Website navigation and fixed visual identity
- Date/navigation row has three equal, matching tiles: **မနေ့ကရလဒ် | ဒီနေ့ပွဲ | ယနေ့ ပေါက်ကြေးများ**.
- No public **မနက်ဖြန်ပွဲ** tab. Yesterday page shows only verified finished games, not a prediction.
- Preserve established dark teal / charcoal backgrounds, orange highlights, rounded cards, Myanmar fonts, team/competition crests and the current website's exact section order and visual hierarchy.
- Both desktop and narrow mobile must display all odds fields without sideways clipping. Mobile on-screen odds can use compact two-line cards instead of a 6-column table; desktop on-screen odds retains the six-column table.
- The match-card and downloadable-image visual contract is **already approved**. No unsolicited change to headings, colors, card proportions, logo placement, one-paragraph copy, odds layout, or H2H/Last Five display.

## 4. "ယနေ့ ပေါက်ကြေးများ" page (complete daily source sheet)
- Include **EVERY match** in the user-supplied dated price list (not just the preview-eligible competitions). Group by competition with its heading/logo.
- Every match shows Myanmar names, true home and away club crests (fallback if not verified), kickoff in Yangon time and date rollover, upper-priced side, **ဘော်ဒီကြေး**, **ဂိုးပေါင်းကြေး**, and **အင်တာနက်ခန့်မှန်းချက်**.
- Screenshot-approved desktop columns (in order): **ပွဲချိန် | ယှဉ်ပြိုင်မည့်အသင်း (home crest VS away crest) | အပေါ်အသင်း | ဘော်ဒီကြေး | ဂိုးပေါင်းကြေး | အင်တာနက်ခန့်မှန်းချက်**.
- Keep user-provided exact strings such as `1-20`, `3+45`, `-85`, `2-100`—DO NOT convert to 1X2. Last PDF column such as `2-1` is an **internet prediction**, NOT confirmed final score.
- Approved descriptive text: **"အာရှ စျေးကွက် မြန်မာကြေး မနက်ပိုင်း ဖွင့်လှစ်မှုများ"**. These are the submitted opening quotes/snapshot, not live IBET789 prices; never label them IBET789 without verified source identification.
- The example on 2026-10-12 contains 17 odds games, of which 9 matched the user's approved leagues; these counts are **historical examples only**, not default daily quantities.

## 5. Match preview cards — EXACT approved content and order
- Burmese team names prominently; correct home/away logos, VS banner, league/fixture/time and venue; preserve professional original website card theme.
- 1X2 full-time decimal market: home win (1), draw (X), away win (2). All three values must come from a dated credible single-bookmaker row, record source and timestamp; never fabricate unavailable prices; keep separate from Myanmar body/goal odds.
- Original Myanmar odds and total-goals price appear separately, with upper team; use exact provided prices only. Do not replace or override prices with guessed conversions.
- Recent history goes between odds and preview text as **THREE SIDE-BY-SIDE PANELS on DESKTOP and full-length PNG**: (1) home team's last five completed games; (2) five verified historical Head-to-Head games; (3) away team's last five completed games. Small genuine club logos where verifiable. On narrow mobile stack panels to keep text readable.
- Full narrative per game is **ONE cohesive natural Burmese sports-commentator paragraph** (not a 22-heading checklist), incorporating BOTH domestic-league teams' verified season P-W-D-L, points/rank as naturally as possible; comparisons of last results, home/away, team news, injury/lineups only if true, form, tactics, grounded side/draw choice, then two plausible scorelines. Use TWO Markdown bold spans for verdict and two scores. Cup/international standings must be factual; never invent a cup league table.
- Special Choice is optional; separate extra researched analysis only if strongly justified; zero is valid.
- Last Five and H2H must comprise only verified full-time historic matches with real dates/scores. Never use predictions as completed games. Missing rows remain absent/empty rather than invented.
- Use `homeDisplay` / `awayDisplay` (Myanmar) for public rendering, `home` / `away` (canonical) for data/identity; `homeCrestUrl`, `awayCrestUrl`, opponent and H2H logos as available. Preserve logos when day reports change.

## 6. Approved downloadable PNG formats — STABLE
- User approved the **original desktop-like website format**, but requested **fast downloads** after DOM Snapshot was too slow. The current chosen implementation is **native custom Canvas** that VISUALLY REPRODUCES the established site, not a redesigned poster. Do not silently revert to slow `dom-to-image`/DOM rasterization or create an unrelated poster design.
- Shared Canvas helper: `canvas-image-kit.js`, Odds/Results: `daily-image-export.js`, full match analysis: `card-export.js`. All use the original teal panels, orange headers, matching cards, logos and Myanmar labels. PNG export should finish promptly, with bounded font/image waits, no external download library requirement.
- **Odds PNG:** title **"ယနေ့ ပေါက်ကြေးများ"**; ONE complete image covering ALL source-sheet matches and EVERY league heading, six matching original table columns, prices and internet predictions. Calculate height from all rows/league groups so the bottom is never clipped. Match the user-approved desktop screenshot visual layout as closely as possible.
- **Preview PNG:** one complete image per match with VS banner, genuine logos, date/league, venue, 1X2, Myanmar quotes, the THREE side-by-side Last 5/H2H panels, **the full fluent Burmese narrative** (not shortened), and Special Choice text only if applicable. Preserve the on-screen content order and brand identity.
- **Results PNG:** title **"ဂိုးရလဒ်များ"**, include all user-visible verified final result cards for yesterday; show only `status:"finished"` with valid sourced `finalScore`. Do NOT include internet predictions, scheduled/future games or unverified score strings.
- Canvas drawing is not guaranteed pixel-identical to HTML/CSS. A visual screenshot-vs-PNG comparison is required for any changes; strive for faithful spacing/colors/fonts and correct legible text, avoid clipping/waiting indefinitely. Use browser/mobile test when possible; code-level CI alone does not prove on-device pixels.

## 7. Research/check/publish acceptance conditions
1. Identify today's local date and supplied PDF/screenshot/source list; archive previous day without erasing verified finals.
2. Verify every relevant list fixture and competition; source 22 research categories per `RESEARCH_STANDARD.md`, including both league teams' real standings and realistic match narrative; no invented lineups or scores.
3. Match PDF Myanmar team names/odds exactly to canonical English fixture identity; keep all source-sheet rows in odds page and intersection in preview page.
4. Obtain credible dated 1X2 odds where possible; exact user-provided Myanmar body/total-price strings; separate internet predictions from actual finals.
5. Validate JSON, `daily_guard.py audit`, Node navigation/export tests and current SHA. Confirm source-to-match mapping, logo URLs, Yesterday/Today filter behavior and only active competitions.
6. **PREPARE, DO NOT PUBLISH UNTIL THE USER EXPLICITLY ASKS.** Once asked, safely commit, read back, check GitHub Actions and Cloudflare live site if accessible; make no unverified claims.
7. No format redesign unless the user explicitly changes this approved standard.

Last implementation approval: 2026-10-12. Latest tested fast Canvas branch includes `canvas-image-kit.js`, `daily-image-export.js` and `card-export.js`.
