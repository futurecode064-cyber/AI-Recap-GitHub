# 2026-10-18 — Editorial fact check and staging audit

This is an **internal source audit**, not a public article or production publication.

## Source inputs and integrity
- 18.pdf, page 1, user-supplied Myanmar morning quote sheet: exactly **19 rows**.
- Verified all **57** price-sheet strings: `bodyOdds`, `goalTotalOdds` and `pdfLastColumn` (19 each). All source numbers remain unchanged.
- PDF final column is **အင်တာနက်ခန့်မှန်းချက်**, NOT a completed FT result. No current/evening quote was supplied; `currentBodyOdds` and `currentGoalTotalOdds` remain empty.
- Previous-date archive 2026-10-17 contains **32** entries with `finished` / syntactically valid FT scores. All **32** recorded scores were individually matched against the Sky Sports 2026-10-17 final-results page for Premier League (5), Championship (11), Bundesliga (6), La Liga (4), Serie A (3), and Ligue 1 (3). Source: https://www.skysports.com/football-scores-fixtures/2026-10-17 .
- Today's 19 source quote rows match all 19 main fixture canonical home/away identities in existing order.
- 2026-10-19 at 01:15 / 01:30 Asia/Yangon kickoffs remain true calendar-date fixtures, but the **editorial-facing night** is 2026-10-18 Myanmar night in both data files.

## Checks on the existing 19 article/card records
- 19/19 team pairs carry home and away club-logo URLs. Existence/rendering of every external logo remains browser-dependent; fallback must be retained.
- League badge map covers all five leagues represented today (Premier League, Serie A, La Liga, Bundesliga, Ligue 1).
- 19/19 cards carry three 1X2 reference numeric values **not** independently verified against exact contemporaneous match-specific bookmaker timestamp. Do NOT advertise as live or guaranteed current quotes.
- 19/19 cards have five W/D/L entries for each club (38 form panels). Many individual entries lack match date/opponent/final score, so they are **not audited as fully detailed verified last-five match reports**.
- 19/19 ordinary previews have one substantial paragraph (>500 characters), with a natural Burmese closing and exactly one named team selection. Some article facts require further independent contemporaneous confirmation.
- All five Special Choices have four existing separate analytical paragraphs and a single selected team in the final sentence; no forecasted final score in these articles.
- 19/19 match previews now hold source-ledger references for a current-season home and away player. 16 `previewV2.status=verified`; 3 remain explicitly flagged `needs-current-form-evidence-review`.

## Three outstanding player evidence reviews
1. Borussia Monchengladbach v Hoffenheim: Lidberg and Asllani dated recent match contributions need further reconciliation.
2. Le Havre v Auxerre: Gallon's match goalkeeping record and Namaso's recent individual contributions need corroboration.
3. Paris FC v Rennes: Lopez's playmaking contribution requires a match-specific source.

**Resolved:** Bayer Leverkusen v Freiburg Schick scoring contribution and Matanovic season attack statistics were checked against Bundesliga official match report and player profile: https://www.bundesliga.com/en/bundesliga/news/mainz-bayer-leverkusen-match-report-highlights-matchday-5-39489 and https://www.bundesliga.com/en/player/igor-matanovic .

Sports Mole's dated Oct 16–17 match previews provide player selection/role and related context. Some FBref search-index results offer additional 2026–27 numbers but direct record access returned 403 and should **not** be treated as a fully read, verified source. In any conflict, prefer contemporary accessible verified records, and omit unsupported claims.

## Release gate
This audit is staged in branch `audit-2026-10-18-fact-check` only. No main-branch update, mirror sync, Cloudflare publication, or completed release is implied. Obtain explicit **GitHub မှာ တင်ပေးပါ** instruction and finish editorial/source regression audit before merge and deploy.
