# FUTURE CODE FOOTBALL DAILY — APPROVED DAILY FORMAT (LOCKED)
Version: 2026-10-15 09:00 MMT — editorial quality correction
Status: USER APPROVED — DEFAULT FOR ALL FUTURE DAILY REPORTS

> This is the authoritative DAILY DESIGN, RESEARCH and EXPORT contract. It supersedes conflicting old README/RESEARCH_STANDARD history (old six-league scope, automatic publishing, tomorrow tab, original DOM screenshot exporter, old canvas layout). Do not redesign or change this format without an explicit new user request. All dates use Asia/Yangon.

## 2026-10-15 — AUTHOR-SUPPLIED CONFERENCE TEXT OVERRIDE (LATEST)
- Owner explicitly requested **exact copy and publication** of 18 Conference League previews provided in `Pasted text(6).txt`, preserved in `data/editorial/2026-10-15-conference-user-verbatim.md`. Match them by canonical home/away identities, **not** uploaded section numbers or the different PDF display spellings. Uploaded no.19–36 cover all 18 Conference matches, but are ordered differently from the website's fixture list.
- Uploaded item **37. Mansfield Town vs Oxford United** belongs to English League One and is preserved in the source archive **only**; it must not be published under Conference League or create a 37th current fixture.
- For these 18 exact owner-uploaded normal previews **only**, the original paragraph text takes precedence over the preceding generic editorial rule forbidding predicted scorelines or "မရှုံး" recommendations. Do not delete the owner's final `ခန့်မှန်းရလဒ်ကတော့ **...** ဖြစ်ပါတယ်။` phrase, their bold forecast, double-chance phrasing, original Burmese spelling, or any other punctuation. Do not paraphrase, correct, or reformat the supplied content.
- This override **does not** modify existing Europa League 18 verbatim previews, five separately researched Special Choice articles, original odds/PNG internet prediction column, 1X2, logos, Last Five panels, finished FT scores, or manual-only deployment.
- Permanent tests assert a character-for-character match between the user source and each correct canonical fixture in the report. Tests and daily guard permit the special two-bold-span layout only for the 2026-10-15 Conference reviews; other editorial rules remain in force.

## 2026-10-15 — LATEST AUTHORITATIVE EDITORIAL OVERRIDE (supersedes old forecast rules)
- All **36 submitted fixtures** require distinct original Burmese professional football-journalistic previews. Example standard: the user's detailed Aston Villa v Fenerbahçe analysis — a natural flowing single paragraph with concrete checked previous results, real team form, meaningful differences in home/away patterns, justified tactical matchups, and confirmed player or injury conditions where available.
- **Do not reuse interchangeable 5-sentence generic previews** merely substituting team names. Verify that each article references concrete match-specific facts, at least one recent completed result for **both** sides, and a reasoned tactical mechanism. Avoid copying formulaic W/D/L text already in form panels.
- One paragraph, exactly **one bold concluding sentence**, which includes a football-based reason and ends with `[အသင်းနာမည်]ကို ရွေးချယ်ပါတယ်။` (or a concrete `ဂိုးပေါ်/ဂိုးအောက် ... ကို ရွေးချယ်ပါတယ်။`). Do not use "မရှုံးတဲ့ရွေးချယ်မှု".
- **No forecasted exact full-time scores inside normal previews or Special Choice reviews**. Actual completed scores in the analysis (such as the user's verified match history example) are encouraged and must be kept distinct from forecasts.
- Every Special Choice is a longer independent professional analysis (four researched paragraphs for today's five). **After the final bold selection sentence, append NOTHING** — no risk note, warning, parenthetical, additional forecast, or extra sentence. Risk analysis belongs *before* the final verdict where relevant.
- Keep the **"အင်တာနက်ခန့်မှန်းချက်"** column and all original user PDF last-column scores in the **Myanmar odds table AND its PNG export**; the editorial no-forecast prohibition does NOT apply to that specifically requested price-ledger column.
- Preserve PDF-original Burmese team display names and other markets (Myanmar body/total, full 1X2), home/away form panels, logos, previously confirmed actual FT results, four branded websites, and manual-only Mirror Sync publishing.
- Before each publish, editorial audit MUST go beyond field counts: inspect every full article for unique match evidence, an accurate latest-result reference for both clubs, a coherent tactical explanation, natural Burmese voice and exact ending. Run Node regression and Python daily_guard audits before merging.

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
- Full narrative per game is **ONE cohesive natural Burmese sports-commentator paragraph** (not a 22-heading checklist), incorporating BOTH domestic-league teams' verified season P-W-D-L, points/rank as naturally as possible; comparisons of last results, home/away, team news, injury/lineups only if true, form, tactics, grounded side/draw choice, then ONE original bold sentence containing a reasoned team or over/under selection. Do not forecast final scores in the narrative. Cup/international standings must be factual; never invent a cup league table.
- Special Choice: for the explicitly approved 2026-10-15 report show 5 separately justified, four-paragraph analyses. The last paragraph ends immediately on the bold direct team/goal-total selection with no text afterward.
- Last Five and H2H must comprise only verified full-time historic matches with real dates/scores. Never use predictions as completed games. Missing rows remain absent/empty rather than invented.
- Use `homeDisplay` / `awayDisplay` (Myanmar) for public rendering, `home` / `away` (canonical) for data/identity; `homeCrestUrl`, `awayCrestUrl`, opponent and H2H logos as available. Preserve logos when day reports change.

### 2026-10-13 permanent Burmese preview-writing correction (user requested)

**Authoritative source of writing style:** the user-approved commentator-style daily football analysis conversation, also codified in `RESEARCH_STANDARD.md` under "Mandatory audience-facing FORMAT" and "Mandatory league-standings inclusion". This update changes the WRITING format and the heading's DISPLAY LANGUAGE, **not** the approved visual design, H2H panel positions, odds, match roster or PNG layout.

1. **Headline:** display the *exact user-PDF Burmese display names* for BOTH teams (`homeDisplay`, `awayDisplay`) prominently as `[အိမ်ရှင်] နှင့် [ဧည့်သည်]`; keep the already-approved competition label and Myanmar-night kickoff shown in the existing card. Never fall back to internal English `home` / `away` identifiers when Burmese labels exist.
2. **ONE organically flowing Burmese sports-commentator paragraph:** start with the match/competition and the verified current situation of both teams; for an ordinary domestic-league match, naturally state **BOTH** sides' verified played, won, drawn, lost, points and league rank. Work meaningful recent results, form, relevant home/away records, team news and tactical strengths/weaknesses into that SAME narrative. Include only externally verified figures. For cup/international games use real applicable domestic-league or group record only where independently verified; NEVER invent a cup standings table.
3. **End of the same paragraph:** first **one bold sentence** choosing the more credible side/draw **with reasons**, and STOP the paragraph there. Do NOT add any predicted full-time scorelines or post-selection warning. Preserve the reader-facing original Burmese voice; do not replace it with artificial headings like Home Analysis / Away Analysis / Statistics / Verdict, bullet lists, odds dumps or separate verdict/score boxes.
4. **Missing research:** do not include a reader-facing research/process disclaimer (especially "H2H missing", "source not found", "AI not published"). Research further; omit uncertain claims. If there is no complete normal preview, render the user-approved exact placeholder **`ပွဲကြိုသုံးသပ်ချက်များ မရသေးပါ`**, NEVER a generic legacy multi-paragraph template.
5. **Integrity:** `dailyPreviewText` is the ONLY source for a normal preview article on screen and in the complete Canvas PNG. Check exactly one bold editorial selection, no predicted full-time scoreline, 1 cohesive paragraph, exact Burmese team identities, the correct home/away side and valid structured standings. New regression test `tests/preview-editorial-format.test.cjs` runs with the existing Node test suite. Keep the 3-panel Home Last 5 | H2H | Away Last 5 position between odds and the article unchanged.
6. **Daily automation and publishing:** before publishing ANY new daily report, read this section and `RESEARCH_STANDARD.md`, then run the editorial-format test. Do not publish under an unverified "looks correct" assertion; if key facts are unverified, prepare a draft and report gaps. Research at 06:00 only; require the user to explicitly ask for publication, as before.

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


## 2026-10-13 VISUAL REDESIGN — NEW USER-APPROVED HIGHEST PRIORITY (overrides previous 3-column H2H rules)
The user supplied a specific reference screenshot on 13 October 2026 and explicitly authorized implementation and website publication. This replaces older H2H in the preview and three panel Home Last 5 | H2H | Away Last 5 requirements. Preserve unrelated odds tables, finished results, original date/tabs, team names, verified content, multi-brand sharing and daily preparation rules.

Every ordinary match card / full-length PNG now shows in this exact order:

1. Large cinematic club-versus-club hero: home-team football figure/photo on LEFT, away team on RIGHT, center competition name and VS, genuine team logos. Beneath, three-section band with exact Burmese home name | both Burmese team names | Myanmar-night kickoff. Optional licensed per-match team photo URLs are homeHeroImageUrl and awayHeroImageUrl, with photo credit URLs homeHeroImageCreditUrl and awayHeroImageCreditUrl. Never present incorrect or unlicensed player photos as verified. With no sourced photograph, render a striking club-colored football-kit illustration plus genuine crest, never an empty or broken hero.
2. Compact မြန်မာကြေး strip preserves exact source-provided upperTeam, bodyOdds, goalTotalOdds. Empty remains dash, never guessed or converted to 1X2.
3. Three adjacent compact panels are NOW: HOME last 5 verified result badges (W/D/L), bookmaker 1X2 HOME/DRAW/AWAY, AWAY last 5 verified result badges (W/D/L). Green W=win, blue D=draw, red L=loss; newest first, missing entries become neutral dashes. NO H2H panel on website or in export. Historical H2H remains optional private/research/archival data only.
4. ပွဲကြိုသုံးသပ်ချက် title followed by the exact single-paragraph professionally researched Burmese commentator narrative. Include two bold spans for a reasoned verdict and exactly two plausible scorelines. Desktop preview font around 18px and mobile around 16.5px; line-height about 2.
5. One full, fast native Canvas PNG containing same hero, logos, original odds, Home WDL | 1X2 | Away WDL, large full-text analysis and brand colors. Height grows to prevent narrative clipping, no H2H.

Shared branding: Original dark teal/charcoal and orange for Future Code Football; the YKZ FAMILY GROUP path preserves its separate scarlet/gold/black palette, correct original brand logo and slogan. Shared JS/CSS/Canvas files and shared dated JSON feed both sites. The full Odds page and Yesterday final-result PNG keep their existing behavior.

Future daily research MUST obtain both teams' actual verified recent five completed games and genuine 1X2, but it need NOT collect new H2H for public previews. Team hero photographs are OPTIONAL until trustworthy, correctly attributed photo assets are available. Do not fabricate images or claim an illustrated kit is an actual player photo.

Verify JS and Node suite, daily Python guard on data updates, PNG completeness, mobile/Desktop and YKZ styles, then write to canonical repository and production mirror on the user's explicit instruction. GitHub commit does not by itself confirm live Cloudflare deployment; check actual live JS/CSS/data.

 
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


## 2026-10-13 PUBLIC HERO AVAILABILITY NOTICE (latest user-approved text)
In the public homepage hero for ALL THREE branded websites — Future Code Football, YKZ FAMILY GROUP and BW SPORT ဘောလုံးဂျာနယ် — replace the old large '06:00 / DAILY FOOTBALL · MMT' (or 'EVERY MORNING · MMT') right-hand hero clock with a compact, readable, responsive two-paragraph notice. Use the user's exact spelling and wording:
1. `နေ့စဥ် မနက် ၇ နာရီ နှင့် ၈ နာရီကြားတွင်`
2. `နေ့စဥ် ကန်မည့် ပွဲများ အားလုံး ကို update ကြည့်ရှူ နိုင်ပါပြီ`
Display exactly once per homepage in `hero-update-notice`, and keep all three sites' existing color palettes. Do not reintroduce English '06:00 DAILY FOOTBALL · MMT' copy. The 06:00 Asia/Yangon AUTOMATION is still a prepare/research-only background task; this visible notice does NOT authorize automatic publication, changing the actual background task schedule, or publishing any unverified football data. Live updates remain subject to the established manual publication approval rule. Keep static copy and real publishing behavior distinct. Regression test: `tests/daily-update-notice.test.cjs`.


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
