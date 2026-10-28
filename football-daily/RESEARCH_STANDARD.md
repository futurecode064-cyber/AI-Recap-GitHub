> **2026-10-28 CURRENT OWNER SYSTEM:** The active daily publication contract is `football-daily/docs/DAILY_PUBLICATION_V7.md` (repository-root path). Read it first. Earlier infrastructure states, paragraph counts, manuscript requirements and separate-approval text below are historical where conflicting. Preserve today's current website system and original journalist master; PDF + “ဒီနေ့အတွက် လုပ်ပါ” authorizes full morning publication with section-by-section validation and live verification.

> **2026-10-17 — CURRENT PERMANENT MATCH PREVIEW RESEARCH/WRITING AUTHORITY:** [PROFESSIONAL_MYANMAR_FOOTBALL_JOURNALIST_MASTER_PROMPT.md](./PROFESSIONAL_MYANMAR_FOOTBALL_JOURNALIST_MASTER_PROMPT.md) supersedes the earlier Professional Preview V2 wording and rigid scorekeeping-in-prose demands. Independently verify the real fixture, correct current season standing, last completed games, active players/coaches, availability and injury updates; write natural original Burmese football-journal analysis that explains why the facts matter for the named opposing team. Include ONE justified team selection at the end, a single continuous paragraph, and no market prices, predicted scores, URLs, copied generic templates or unsourced stats. Do not auto-publish or change mirror styling; owner approval remains necessary every day.

> **PROFESSIONAL PREVIEW V2 — HIGHEST PRIORITY FROM 2026-10-17:** Owner-approved [DAILY_APPROVED_FORMAT.md](./DAILY_APPROVED_FORMAT.md) V2 supersedes all conflicting old rules (old single bold phrase, 3-paragraph draft, and predicted score examples). One rich, original single-paragraph Burmese journal article per fixture; evidence-linked current key player for BOTH clubs where actually verified, cited manager/team-news only if contemporary; allow multiple inline bold verified names and one final bold reasoned verdict. Capture per-match `previewV2` evidence ledger and require the quality gate plus editorial source audit before publication. Never fill empty required evidence with invented players or generic filler. Preserve older original authored dates in their archives.

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


## 2026-10-13 LAST USER IMAGE REFINEMENT — ONE CENTER MATCH TITLE ONLY (supersedes previous three-caption hero bar)
The user's uploaded picture has the same home-team name twice (once alone under the left logo and once inside the middle pair). The request is to **remove the standalone name below the logo**, NOT to replace the right date/time with another duplicate standalone away-team name. Thus the FINAL hero is: CENTERED home club crest only | league + VS | CENTERED away club crest only; and the BOTTOM TITLE BAR prints **ONLY ONE centered Burmese '[HOME] နှင့် [AWAY]' matchup heading**, with EMPTY decorative left/right bar sides. Do not print an individual HOME label under left logo, individual AWAY label under right logo, or any date/time in this ordinary preview header. Keep genuine crests, no players/jerseys/photos; retain the existing W/D/L | 1X2 | W/D/L odds layout and full Burmese paragraph. The full Canvas PNG mirrors this sole centered match title, not three labels. Kickoff information remains intact in the dataset and dedicated schedule/odds/result contexts. This clause is the highest-priority rule when older project notes conflict.

 
## 2026-10-13 latest Special Choice operating standard (user-approved)
The user explicitly requires **at least ONE and at most THREE carefully selected Special Choice matches per daily published report**. On match-rich days when 2–3 genuinely strong independently substantiated choices exist, feature 2–3, otherwise prioritize 1 best defensible pick. This overrides earlier wording that zero Special Choices may routinely be published. Never fabricate a pick or invent missing data merely to hit the minimum: if none qualify, hold publishing and report the verification blocker.

Keep the most current fixed crest-only hero, sole centered match-title, Myanmar odds + HOME WDL | 1X2 | AWAY WDL, no public H2H and full native Canvas PNG. Do not change the normal professionally written dailyPreviewText; Special Choice is **additional**, containing at least four substantive, original, natural Burmese analytical paragraphs separately in specialAnalysisParagraphs, rendered ONLY in the Special Choice filter (and included in Special Choice PNG). They must compare:
- Both teams' verified league/competition context, last 5 finished results, home/away form and goal creation/defense.
- Independently sourced tactical implications and accurately attributed available player/team news (no guessed injury or lineup).
- Real bookmaker full-time 1X2 compared cautiously to the separate original Myanmar handicap/goal opening-price notation; consider the risk/value trade-off without manufactured probability or promised profit.
- Concrete upset/draw risk, reasoned preferred match outcome, and two plausible completed-score scenarios, phrased without certain-win rhetoric.

Each picked fixture must carry specialChoice:true, specialChoiceRank (1–3, contiguous), specialRiskNote, at least two specialResearchSources URLs, the day's specialPreparedDate, and substantial specialAnalysisParagraphs. Sort the Special Choice filter by specialChoiceRank; the ordinary 'all games' tab should retain every match. 2026-10-13 selected three ranked games: Birmingham City–Preston (1), Galatasaray–Barcelona (2), Inter–Club Brugge (3). Keep each match's exact Burmese source labels; do not replace the original normal preview or bookmaker odds. Run tests/special-choice.test.cjs plus the normal test suite before publishing. The standing 06:00 scheduled preparation task follows this rule; publishing still requires separate explicit user instruction.

 
## 2026-10-13 Special Choice single-article display override — user screenshot correction
This supersedes every prior instruction that Special Choice should display BOTH the normal paragraph AND a separate special block.

- When a visitor selects the **★ Special Choice** filter, a selected match displays **ONLY** its verified 4+ paragraph `specialAnalysisParagraphs`, headed `★ Special Choice #N — အထူးပွဲကြိုသုံးသပ်ချက်`. DO NOT render `dailyPreviewText`, its normal `ပွဲကြိုသုံးသပ်ချက်` heading, or a second ordinary-preview panel above/below the special narrative. If special analysis is genuinely absent, show only `ပွဲကြိုသုံးသပ်ချက်များ မရသေးပါ` instead of leaking the normal one.
- In regular **ပွဲအားလုံး** and competition filters, display ONLY `dailyPreviewText` (even for a match flagged specialChoice=true); do not append special-analysis paragraphs in those views.
- The **downloaded single-match Canvas PNG** must always match the selected view: Special Choice filter => specialAnalysisParagraphs only, one Special Choice heading, full article with auto-growing canvas height. Normal/league filter => dailyPreviewText only, one normal heading. Never duplicate a regular and a special narrative in the same PNG.
- Keep the published expert articles, original team crests, sole centered Burmese match title, odds, W/D/L, no public H2H, Special Choice ranking and exact brand color themes untouched. Apply to Future Code, YKZ and BW SPORT because they all import the shared root app.js/card-export.js.
- Regression tests must assert both DOM-branch exclusivity and actual Canvas strings in each mode; run tests/special-choice.test.cjs, tests/export.test.cjs and full Node suite prior to declaring production ready.


## 2026-10-14 LATEST USER EDITORIAL CORRECTION — NO BOILERPLATE INSIDE NORMAL PREVIEWS
The user rejected the live screenshot of the 14 October daily football preview: it contained an autogenerated, comma-separated last-five W/D/L recital, references to `14.pdf`, full-time 1X2 vs body-handicap pedagogy, and raw opening-price symbols in the match-preview prose. This **explicit user correction takes priority** over older guidelines about narrating all raw odds inside the regular commentary.

**Normal `dailyPreviewText` for EACH fixture must be one naturally flowing, well-edited, professional Burmese sports journalist paragraph**, not rigid slots or templated sentences. Use authentic verified recent match score/form as meaningful context, both teams' relative strengths, sourced available news/injuries, tactics, home/away dynamic, a concrete risk/deciding factor, then exactly TWO bold spans in this order: reasoned preferred team/outcome and two possible FULL TIME scorelines separated by `သို့မဟုတ်`. Native Myanmar digits, nuanced plain Burmese prose, and no repeated wording across every match. For domestic leagues, correctly sourced played/W/D/L/points/ranks for both clubs should appear organically in this narrative (no fabricated figures or unverified league standings).

**Forbidden in normal commentary:** the literal filename `14.pdf` or any PDF/file provenance, bookmaker/1X2 educational filler, printed raw Myanmar handicap or goal-total quote notation, `ပွဲမတိုင်ခင် နောက်ဆုံးရလဒ်တွေမှာ [team] ဘက်က 5 ပွဲအတွင်း ရှုံး၊ နိုင် ...` auto-generated recitals, machine research disclaimers, league-table checklists, duplicative generic fact dumps, copy-pasted article templates. The match graphic already has dedicated Myanmar body/goal odds plus separately sourced 1X2 and the colored HOME W/D/L | bookie fulltime 1X2 | AWAY W/D/L strip; do not repeat them as a mechanically generated prose list. Match article must read like a trusted Burmese football journalist analysis. A concise, relevant match-form contrast is allowed when it genuinely explains play.

**Special Choice**: retain four original, substantial analytical paragraphs including tactical matchup, well-verified squad status, separate Myanmar market vs 1X2 interpretation, sober risks and two scores. Do not refer to internal PDF file names. The Special Choice filter and PNG show **only** these specialAnalysisParagraphs, never append dailyPreviewText. Normal/league filter and normal PNG show **only** dailyPreviewText. All four brands (Future Code, YKZ, BW SPORT, Ko Thet) use the one shared report and identical editorial text and exports. Preserve user-provided prices/team names/actual dates/last-five source metadata, no guesses. Tests in `tests/preview-editorial-format.test.cjs` must block accidental return of the screenshot's auto-template boilerplate.


## 2026-10-14 08:34 MMT — FINAL Special Choice article cleanliness override (user screenshot)
Latest explicit user correction: **Remove odds and bookmaker commentary from Special Choice written analysis as well**, not merely from normal articles. The prior specification demanding separate Myanmar/body prices versus independent 1X2 comparisons INSIDE the four special paragraphs is superseded. Prices, upper team, goals line and bookmaker 1X2 remain available ONLY in the already dedicated match-market panel and odds table, using original verified user data; keep the actual data unchanged.

- In `specialAnalysisParagraphs`, do not include raw handicap quotes, numbers such as `1-10` or `3=` as pricing, `1X2`, bookmaker brand names, `14.pdf`/PDF, words `ဘော်ဒီကြေး`, `ဂိုးပေါင်း`, `အကျောကြေး`, `အပေါ်အသင်း`, `ဈေးကွက်`, or a tutorial explaining market pricing.
- Each of the four substantial Burmese paragraphs should focus on researched club form and standings where available, squad fitness, tactical matchup, home/away conditions, key threats, plausible match paths and genuine risks. The final paragraph must close with a meaningful bold outcome pick and **two plausible bold full-time scorelines** joined by `သို့မဟုတ်`. No duplicate normal match article.
- The Special Choice filter and its one-piece full Canvas PNG must show ONLY the four special paragraphs, not `dailyPreviewText`. Match hero and separate market/last-five panels remain intact. Do not remove prices from their dedicated data or odds table.
- Applies across all FOUR football websites and all future daily updates. `tests/special-choice.test.cjs` enforces the ban on boilerplate.
- Odds-sheet screenshot requirement is separately implemented in `odds-sheet-theme.css` and `daily-image-export.js`: headings only use brand-specific teal, red, blue or burgundy/gold; table body white/off-white, black text, gray grid, and all rows preserved. Do not revert to dark odds tables.
