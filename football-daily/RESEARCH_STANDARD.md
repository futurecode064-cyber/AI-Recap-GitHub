> **AUTHORITATIVE DAILY FORMAT:** Read [DAILY_APPROVED_FORMAT.md](./DAILY_APPROVED_FORMAT.md) before this research specification. It locks the user-approved Burmese names, full daily odds list, one-paragraph commentary, 3-panel Last 5/H2H, 1X2, opening-price usage, Canvas image layouts and manual publication. If older sections disagree, the approved format wins.

# Future Code Football — Daily Match-Preview Research Standard
Version: 2026-10-11. Applies to ALL ordinary match previews, not only Special Choice.

## Mission
User's 22-point prompt is the **FORMULA for writing fresh original daily WEBSITE match previews**. Research all available data for real same-day matches, then write a fresh Burmese narrative for each match into `dailyPreviewText`. Do NOT demand the user supply old ChatGPT messages, and do NOT treat this formula as text to paste. Special Choice adds separate deeper analysis using `specialAnalysisParagraphs`.

## 22 research areas (for **every** match)
1. COMPETITION — confirmed competition, season, matchweek/round, kickoff, venue, match status, teams.
2. CURRENT LEAGUE TABLE — position, played, W-D-L, GF, GA, GD, points, home/away splits; explicitly contrast standings and points.
3. TEAM A LAST 5 — opponents, competition, home/away, results, goals, clean sheets, form and totals.
4. TEAM B LAST 5 — same fields.
5. HOME LAST 5 — home team's last five home games, W/D/L, goals for/against, averages, clean sheets.
6. AWAY LAST 5 — visitor's last five away games with the same metrics.
7. GOAL STATS — goals per game, goals conceded, clean-sheet and failed-to-score rates, BTTS and over/under 1.5/2.5/3.5, first-/second-half goals.
8. ADVANCED STATS — xG/xGA/xGD, shots, shots on target, big chances, possession, passing, progressive passes, corners, fouls, offsides, PPDA, defending, only if sourced.
9. H2H LAST 5 — opponent, date, venue, scores, W/D/L, BTTS and O/U; never over-weight old H2H.
10. INJURIES — named players, positions, injury, expected return, expected availability, team relevance, verified date.
11. SUSPENSIONS — player, ban reason, duration, eligibility.
12. LINEUPS — preferred formations and probable starting XI, clearly label 'expected'; confirmed XI only after official lineup release.
13. TACTICS — formation, possession, pressing, transitions/counters, high/low block, build-up, set pieces, weaknesses.
14. KEY PLAYERS — goals, assists, chances, xG/xA, shots, defensive value and verified recent form.
15. LATEST CLUB NEWS — manager quotes, training, rotation, travel, rest, fatigue, squad issues.
16. MOTIVATION — title, qualification, promotion, relegation, cup and must-win stakes, evidence-based.
17. VENUE/HOME EDGE — exact ground, home record, away record, goals at venue.
18. WEATHER/PITCH — weather, temp, rain, wind, surface; mention only if it materially affects the game.
19. REFEREE — assigned referee, penalties, cards, fouls; mention only with credible and relevant data.
20. ODDS — one bookmaker's coherent pre-match fulltime 1X2 row, bookmaker/source/verification time, O/U/BTTS/AH ONLY if separately verified. Odds are supporting evidence, never sole prediction reason.
21. REST/SCHEDULE — last kickoff, days of rest, travel, upcoming games, extra-time, fixture congestion.
22. LATEST FINAL CHECK — most recent verified pregame late injuries/withdrawals, suspensions, lineups and manager decisions; recheck close to match kickoff where possible.

## Minimum editorial research / source hierarchy
Prioritize Tier 1 official league, official club, and official competition site; next Tier 2 established football match-data providers and reputable sports news; Tier 3 journalists and tactical-preview sites only as supporting evidence. Internally record source URLs and verification timestamps for all factual assertions; never substitute guesses for unsourced metrics.

Research the essentials for BOTH teams: table, last five, relevant home/away form, goal stats, H2H, injuries, suspensions, projected lineups, key players, tactical styles, stakes, latest news. Read actual source pages, not just website names. If a category cannot be verified, **do not invent the data or print a filler heading for it**. Mark internally as unavailable and omit unsupported claims from the preview. If a match has too little verified information for a defensible choice, say so and do not mark as Special Choice.

## Final analysis: a freshly researched original website article in Burmese
Transform the sourced research into one fluent, readable professional match preview—not a pasted 22-heading checklist and not a standalone source dump. Write through this order:
**DATA → FORM → TEAM NEWS → TACTICS → KEY FACTOR → COMPARISON → FINAL VERDICT**.
Answer, backed by cited research:
- Home team's most important strength.
- Home team's biggest weakness.
- Away team's most important strength.
- Away team's biggest weakness.
- Which side, if any, is preferable; why; acknowledge uncertainty and quote-dependent decisions.

Use the user's daily football-preview voice; complete Burmese paragraphs. Include useful relevant concrete verified numbers. DO NOT add unsupported stats, invented injuries, quotes or market odds. Do not falsely assert automatic availability or outcomes.

## Website JSON workflow
Main site: https://future-code-football-daily.pages.dev/
Repo: futurecode064-cyber/AI-Recap-GitHub
Branch: football-daily-render
File: football-daily/data/today.json
Per match: `dailyPreviewText` = FRESH Burmese analysis produced using the user's 22-category research formula for today's actual fixture. The browser displays this newly researched text directly. Do not require old daily chat messages, and do not reuse an unrelated previous-day preview.
Keep already-existing club logos using `homeCrestUrl`, `awayCrestUrl`. Keep `homeOdds`, `drawOdds`, `awayOdds` as numbers/decimal strings or null; carry `oddsProvider` and `oddsSourceUrl` after genuine source verification.
Store `researchSources` as a private editorial-style record **in JSON if useful** (the public JSON URL itself is accessible: do NOT store secrets or privacy-sensitive data). Source URLs need not appear in page text.
Add `specialAnalysisParagraphs` **only** for `specialChoice:true` games. The frontend renders this extra researched content only in the Special Choice filter.
No demo preview link; no selection-confidence label; only today's date in Asia/Yangon; unknown categories omitted.

## Special Choice
This is separate, more intensive analysis, **additional to and never a replacement for** normal freshly researched `dailyPreviewText`. Research more deeply using latest 5-game form, home-away splits, tactical mismatch, 1X2, Asian Handicap and risk/value where authentic prices exist; prove each conclusion and name risks. Use no guaranteed-win language. Can be zero Special Choices.

## Daily publishing sequence
1. Verify same-day fixtures and kickoffs in Asia/Yangon.
2. Gather 22 category inputs; prioritize trustworthy latest source docs.
3. Research and write today's NEW `dailyPreviewText` article separately for each verified real fixture following the 22-item formula.
4. Research Special Choice separately.
5. Prepare JSON for the correct Yangon date, commit to GitHub with current SHA.
6. Read back the committed JSON and verify today's match articles are present, complete, and correspond to sources.
7. Tell the user that today's website match analysis has been published, and optionally summarize or share the website link in ChatGPT.
8. Check Pages live `data/today.json` if possible; do not claim success until verified.

## 2026-10-11 implementation
All 18 match articles were freshly researched and rewritten from the 22-category formula on 11 October 2026. Missing data categories were omitted. The data is published under `football-daily/data/today.json`, and source links are stored with each article.

## Mandatory audience-facing FORMAT — 2026-10-11 user-selected version
Every ordinary football-preview card must display ONE cohesive natural Burmese sports-commentary **paragraph** per match (roughly 130–240 Burmese words, flexible), not four or five research sections and not a research checklist. Lead with a manager/team's current standing, points, matches played and W-D-L / latest real scores when available; naturally compare home vs away form, recent results, injuries/team news, tactics and what matters. State a grounded **preferred team or draw** near the end, followed by **two plausible scorelines** in the same paragraph, e.g. `**မန်စီးတီးကို အနည်းငယ်ပိုရွေးချယ်ချင်ပါတယ်။** ... ခန့်မှန်းရလဒ်ကတော့ **၁-၂ သို့မဟုတ် ၂-၂** ဖြစ်ပါတယ်။` The website safely renders the two `**...**` emphasis spans as bold. Burmese team/manager/player transliterations should be natural and commentator-like; maintain a smooth story without mini-headings, tables, 22-item enumeration, or separate verdict/score panels for normal previews.

**Never write reader-facing disclaimers** such as 'အချက်အလက် မရှိလို့ မဖန်တီးပါဘူး', 'မအတည်ပြုရသေးတဲ့ Data ကို မထည့်ပါဘူး', 'Source မရသေးပါ', or explanations of the research process. Continue rigorously to OMIT unsupported facts without announcing the omission. Do not fill unverifiable standings or scores. Keep 1X2 bookmaker odds visible in the website's separate odds bar, not inserted as filler. Special Choice keeps its own extra full-length researched paragraphs ONLY inside the Special Choice filter, without changing the normal one-paragraph style.

## Mandatory league-standings inclusion — 2026-10-11 clarification
For **every** regular match preview, the user requires a natural Burmese sentence telling **both** home and away team's exact **matches played (P), points (Pts), and current league position (Pos)**, ideally W-D-L too, BEFORE tactical comparison. Include both in the single original flowing paragraph — not as an external league table, badge, or separate research-format heading. Use the **fixture's most recent pre-match standings**, be explicit that figures are as of the beginning of that round if other matches in that round have already occurred, and do not mix pre-match and post-match standings or infer missing numbers. A model sentence: `ပရီးမီးယားလိဂ် ပွဲစဉ် (၆) မတိုင်မီ ပဲလေ့စ်က ၅ ပွဲကစားပြီး ၄ မှတ်နဲ့ အဆင့် ၁၅ မှာ ရပ်တည်နေချိန် ဖောရက်စ်က ၅ ပွဲကနေ ၅ မှတ်ရထားပြီး အဆင့် ၁၃ မှာ ရှိနေပါတယ်။` These are 2026-10-11 numbers only, not future-date defaults.

Store verified `homeStanding` and `awayStanding` objects in each match JSON, containing `played`, `wins`, `draws`, `losses`, `points`, `position`, and `standingsSourceUrl` (credible same-season reference), so that the publishing audit can catch omissions. Check sums (`played=wins+draws+losses`) and league size. When official ranks can't be substantiated, don't make them up: research further and hold that fixture article from publication until sufficient verified information is available; do not post fabricated ranks. Keep the actual paragraph smooth with no duplication, research explanations, or table-like field labels.


## Website feature contract — date tabs + sourced H2H / Last Five + social posters (2026-10-11)

- The existing familiar match-preview website format, editorial voice, 1X2, user-entered Myanmar-odds rules, and existing full-length PNG must **not** be removed.
- Browser date tabs use Yangon-local calendar days, NOT viewer-local dates. `football-daily/data/today.json` holds TODAY. `football-daily/data/archive/YYYY-MM-DD.json` holds YESTERDAY (and previous preserved days). `football-daily/data/upcoming/YYYY-MM-DD.json` holds TOMORROW pre-match fixtures if researched and verified. Every file's `reportDate` must exactly equal its pathname date; absent dated files must remain absent rather than contain invented fixtures.
- **Before overwriting today.json**, preserve the outgoing day's report in the correct archive path if it does not already exist; if it exists, update without destroying any newer verified final results. Do not copy an old `today.json` into the new day's report. Currently `archive/2026-10-11.json` exists with the Oct 11 pre-match report and **no confirmed final scores**.
- For YESTERDAY, research official/credible *full-time final* results for the previous Yangon date, match home/away identity and competition, and update its archived matches with `"status":"finished"` and `"finalScore":"2-1"` **only** after final results genuinely verified. Unverified results remain without `status:"finished"`. The browser purposely shows only verified finished games in yesterday view; do not manufacture any scores.
- For TOMORROW, if fixtures can be reliably confirmed, create/update `upcoming/YYYY-MM-DD.json` with the verified club identities, kickoff in MMT, crests, league, and researched preview/odds only if genuinely available. Tomorrow may legitimately be empty when no data is verified. The standard 06:00 report publishes today's verified fixtures first; do not sacrifice today's quality to fill tomorrow.
- In every researched preview, independently collect structured `homeLastFive` and `awayLastFive` (up to five games each) and `headToHead` (up to five historical H2H games). Fields for each `homeLastFive`/`awayLastFive` element: `{date:"YYYY-MM-DD",opponent:"Team",venueSide:"home"|"away",teamGoals:integer,opponentGoals:integer,competition:"...",sourceUrl:"https://..."}`. `teamGoals` always means the named team's goals; `venueSide` describes whether that named team hosted. `headToHead` elements: `{date:"YYYY-MM-DD",home:"Team",away:"Team",homeGoals:integer,awayGoals:integer,competition:"...",sourceUrl:"https://..."}`. Most recent first; finals only. Include no unverified rows. An omitted/empty array is valid when reliable sources cannot be found. Existing current-date report may show the panel's pending-data text until sourced historical results are added.
- H2H / Last-5 **appears between Myanmar odds and the flowing Burmese match preview**. Keep the one-paragraph editorial commentary untouched; do not replace with a stats checklist. Club logos beside the last-five team headings.
- Keep the full-article PNG exporter (`card-export.js`), plus social image exporter (`social-export.js`) at EXACT 1080×1080 (Facebook), 1080×1350 (4:5 Feed), 1080×1920 (Story). Fixed-aspect social images show a truthful, visually truncated **summary**, while the full-text PNG remains available. Auto-include each site's brand name and logo-image when a valid `data-football-brand-logo-url` is configured, with branded text/icon fallback. Never expose provider/source names on exported posters.
- Publish and inspect JSON integrity, JS syntax, user-visible site and downloads where tools allow. Distinguish code-level checks from real-browser rendered PNG verification.


## 2026-10-12: latest user-approved competition and editorial contract (overrides previous date-tab and six-league scope)
- Date navigation is **YESTERDAY + TODAY ONLY**. Remove TOMORROW tab from both entry pages; archived previous-day verified FT scores remain supported. Do not prepare or publish a public tomorrow tab.
- Approved canonical competitions: Premier League, Championship, League One (England third tier), La Liga, La Liga 2, Serie A, Serie B, Bundesliga, 2. Bundesliga, Ligue 1, Ligue 2, FA Cup, EFL Cup (Carabao/League Cup), Coppa Italia, Copa del Rey, DFB-Pokal, Coupe de France, UEFA Champions League, UEFA Europa League, UEFA Conference League, UEFA Nations League (national teams), FIFA World Cup, FIFA World Cup Qualifying, UEFA Euro, UEFA Euro Qualifying. "National League" in the context of national-team football refers to UEFA Nations League, NOT England's fifth-tier National League.
- Competition filter buttons MUST be generated from the **published fixtures for the selected Asia/Yangon date only**; hide every competition with no matches. Special Choice filter appears only when a verified matching choice exists. Never render the no-fixture leagues list to readers. Preserve normal card, Myanmar odds, last-five/H2H, preview, and full PNG.
- For league games, validate both teams' true same-season position/P-W-D-L/points; league sizes: EPL, La Liga, Serie A and Serie B 20; Championship/League One 24; La Liga 2 22; Bundesliga/2. Bundesliga/Ligue 1/Ligue 2 18. For knockout cups and international fixtures, do not invent a nonexistent cup league position. Give independently verified relevant league or group records in prose where useful and sourced; cup-specific standing JSON is not required by audit.
- H2H and each team's last 5 must come from VERIFIED completed match records across competitions where possible. Check official competition/club results, ESPN, AiScore H2H/Last 5 and LiveScore if accessible and permitted; verify date, home/away identity, competition and full-time score, prevent future fixtures and never treat AI predictions as finished results. Preserve record-level sourceUrl where available and do not display source/provider names in public design. ESPN sync is only a fallback for published reports and may cover a subset of histories; do not assume its coverage is complete.
- Myanmar odds: research readable, current and identifiable public Myanmar-odds pages when possible, but **do not assert any quote matches IBET789** without a verified named current IBET789 source. Do not convert generic decimal/Asian handicap odds to made-up local body/goal-price notation. Keep exact user-supplied same-day Myanmar odds untouched. If any odds values come from independent verified readable pages, track source, capture date/time, fixtures and provider internally and explicitly distinguish that market from IBET789; otherwise leave Myanmar odds blank. A found public page is NOT evidence its current price can be automatically extracted.
- At 06:00 Asia/Yangon the **ChatGPT scheduled task prepares research/JSON only**; it does NOT publish to GitHub or the live site. The user will explicitly ask for GitHub publishing after receiving the preparation report. No Football API key nor AI API key should be requested.
- These rules supersede older README instructions referring to automatic 06:00 publishing, the six-league-only brief and tomorrow reports.


## 2026-10-13 permanent update — EXACT accepted commentary style (current highest-priority writing rule)

The user expressly requested that every website football preview always follow the previously approved ChatGPT match-analysis style. The `DAILY_APPROVED_FORMAT.md` is authoritative. Keep the **existing site and downloadable full PNG design** while enforcing these editorial requirements:

- Headline: **[Burmese home team] နှင့် [Burmese away team]**; team names must come verbatim from the daily user PDF/sheet `homeDisplay` and `awayDisplay` (never internal English match keys), plus the already-displayed league and Myanmar-night kickoff.
- Article body: write a **SINGLE natural, connected, professional Burmese football-commentator paragraph**, generally 130–240 Burmese words (flexible for genuine depth). Give true, sourced context of BOTH teams. For domestic league games, include BOTH teams' pre-match **played, wins, draws, losses, points and position** naturally near the start — NO separate table in the article or unsubstantiated numbers. If cup/continental, include only independently verified applicable league or group standings; never pretend there is a cup league rank.
- Flow: table/current situation → verified recent results → genuine home-away form and team news → strengths, weaknesses and tactical comparison → the key deciding factor → a justified side/draw choice. Omit unverified injuries, tactics asserted as fact, records and news rather than guessing.
- Final prose: place **exactly TWO Markdown bold spans** within the SAME paragraph, one for the professional justified preferred side or draw, one for **TWO scorelines** joined by `သို့မဟုတ်`. E.g. schematic only: `**[ရွေးချယ်မှုနှင့် အကြောင်းပြချက်]** ခန့်မှန်းရလဒ်ကတော့ **[ရလဒ် ၁] သို့မဟုတ် [ရလဒ် ၂]** ဖြစ်ပါတယ်။` Bracketed placeholders are NOT copy for publication.
- Do not add source/process disclaimers to reader-facing prose, fake H2H or unsupported statistics, four research headings, machine-generated-looking red/blue blocks, English team headings, or independent normal preview verdict panels. The three existing Last Five | H2H | Last Five cards belong BETWEEN the odds and this narrative.
- Frontend must render the fresh `dailyPreviewText` VERBATIM with bold emphasis safely, or the EXACT placeholder `ပွဲကြိုသုံးသပ်ချက်များ မရသေးပါ`. Old `analysisParagraphs`, `analysis`, `verdict`, `predictedScore` must not override the one-paragraph format. Special Choice retains distinct extra material ONLY for verified special picks.
- **Before every publish**: run `node --test football-daily/tests/*.test.cjs`, particularly `preview-editorial-format.test.cjs`. Verify both domestic standings and narrative, correct exact Myanmar team labels, two bold spans and two scores, source integrity, true fixtures, and full PNG text. Hold invalid articles for further research, rather than producing reader-facing filler or data inventions. The 06:00 Asia/Yangon scheduled task remains *research/prepare only*; GitHub/Cloudflare updates require the user's explicit publishing request.



## 2026-10-13 later screenshot-based visual redesign (supersedes all older H2H visual and export instructions)

The user explicitly approved the screenshot-style preview with **football-team hero images, much larger Burmese prose, no H2H display, compact W/D/L circles for each team's last five and middle odds**. The last section of DAILY_APPROVED_FORMAT.md is now the controlling visual contract. Prior descriptions of three side-by-side Last Five | H2H | Last Five cards are obsolete for the public page and PNG. H2H may remain in archives and research but no longer requires publication or new collection merely for the preview design.

Research the two teams' authentic last five *finished* scores and order newest-first; translate to W = win, D = draw, L = loss based on that team's scored/conceded final goals. Put Home WDL in the left mini-panel, original valid bookmaker HOME/DRAW/AWAY 1X2 in the middle panel, and Away WDL in the right mini-panel. Show the source-provided Myanmar handicap/total quote in its own strip immediately above that row; the PDF prices may never be transformed into fake 1X2.

Preserve the existing one-paragraph professional Burmese narrative exactly, including verified standings, recent results, tactical reasoning, and the two bold verdict/score spans. Display desktop text at least approximately 18px and narrow mobile 16.5px, with good spacing. A club photograph is used ONLY when correctly club-matched, reuse-permitted and attributed; otherwise a football-kit illustration with authentic logos fills each hero side. New optional match data fields: homeHeroImageUrl, awayHeroImageUrl, homeHeroImageCreditUrl, awayHeroImageCreditUrl. Keep originals' branding and a complete Canvas PNG with no H2H.

Test and visually validate production both on the Main Future Code and YKZ FAMILY GROUP pages; verify matching PNG and new responsive CSS before reporting live. Daily research remains prepare-only at 06:00 Asia/Yangon unless the user separately instructs publishing.

 
## 2026-10-13 FINAL HERO CORRECTION — USER SCREENSHOT OVERRIDE (highest-priority hero rule)

The user reviewed the actual rendered match hero and requested a simpler design. This section **overrides all previous photo/kit/silhouette/date-time hero requirements**. It applies to main Football and YKZ branded shared preview cards and to each match's full Canvas PNG:

- Hero left half: ONLY the real HOME club crest, centered both vertically and horizontally, large and clear, on an attractive unobtrusive dark club-colored background. Hero right half: ONLY the real AWAY club crest, centered identically. No illustrated human, jersey or player image, no photo overlays, no extra name caption under the crest. Do not load optional HeroImageUrl photos in this header.
- Center still shows the league and large VS.
- Exactly three columns in the bottom bar: **home Burmese name | home နှင့် away Burmese names | away Burmese name**. The right column NO LONGER displays the match date/time.
- Do not display a kickoff date/time in the top strip of the ordinary preview match card either. (Keep kickoff date/time accurately stored in JSON and the odds schedule/results where needed; this request is limited to the preview graphic.)
- The W/D/L – bookmaker 1X2 – W/D/L strip, Myanmar prices, larger fluent Burmese commentary, H2H removal, original YKZ colors and complete PNG download still remain exactly as previously approved.
- Guard via regression tests and verify BOTH GitHub production mirror and the actual Cloudflare public JS/CSS. Do not reintroduce player photos merely because they appear in older editorial notes.
