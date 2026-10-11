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
