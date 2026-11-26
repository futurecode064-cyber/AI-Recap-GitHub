## Owner clarification — 2026-11-26: football-only published prose

Evaluate handicap and total-goals prices privately when deciding between teams, Over or Under. NEVER include odds/prices, required goal margins, partial settlements, profit/loss percentages, or price/value arguments in published preview prose, V2/V3/V4 summaries, Special Choice or their English translations. Public reasoning must explain verified form, attacking/defensive performance, availability and tactics. Keep the final selected team/Over/Under consistent. Existing separate odds tables and market fields remain intact. This overrides the earlier instruction to explain price requirements inside the article.

## Owner correction — 2026-11-26: all PDF fixtures and price-aware selections

Every fixture in the owner’s current PDF must appear in the daily previews, odds, and VIP Internet / Bookies / AI Tips coverage. Do not restrict the edition to three matches or only Premier League, Serie A and LaLiga. Retain every row and verify its identity. Special Choice remains ONE unless the owner changes it.

Preview selections must target the actual Myanmar handicap or total-goals price, not simply the team most likely to win the match. Evaluate both the giving and receiving sides and Over/Under independently. A famous club or a favourite is not a reason to select it. Assess margin and settlement privately; publish only football reasons for the selected outcome, without quotas or guarantees. Allowed selection labels are the exact PDF home/away display name, `ဂိုးပေါ်`, or `ဂိုးအောက်`. Keep full preview, V2/V3/V4 selection, Special Choice, results, English translation and every PNG/ZIP consistent. Do not force all selections into team-winner fields. A missing 1X2 quote stays explicitly unavailable and may not be invented; other verified markets can still be analysed.

# Future Code Daily Tips – Publishing Contract (every morning, Asia/Yangon)

This is a standing instruction for every future day's publication, not a one-off prompt. When creating or updating \`data/today.json\`, always prepare the companion file \`data/tips/YYYY-MM-DD.json\` with independently sourced VIP tips. Never copy a score from a bookmaker calculation or the Poisson model into the VIP field and call it a web tip.

## Three genuinely separate columns

1. **VIP Internet** – Search current external football match-preview/tips websites (e.g. FootballPredictions.com, Sports Mole, Forebet, PredictZ), match the exact home/away teams, competition, fixture date and orientation. Record a published correct score with sourceName, sourceUrl, sourceDate and fixtureId. Check the external article on each publication date; do not carry yesterday's records forward. An article quoting only win/BTTS with no exact score does not qualify. If none verified, display "—" rather than invented content. Official users can audit the URL.
2. **Bookies** – Estimate a *model-based* most plausible score using the published 1X2 implied probabilities, the original/updated Asian goal total (and direction of body handicap for sanity checking). Strip overround from 1X2; infer favourite/result from prices; combine goal total with goal distribution. This is not an official bookmaker correct-score quote. If one of the necessary markets is missing, display "—" and do not pretend it is observed.
3. **AI Tips** – Use the site's existing last-5 + current season Poisson goal model, highest-probability exact score as the independent output. This should not be filled by a VIP article or copy of the bookie score.

All three use English numeric scorelines "home-away". A coincidentally matching score between independent sources is allowed. Do not alter confirmed scores once games start, or turn previews into results. For unavailable fields use em dash. Do not insert exact scores into Special Choice editorial selections.

### File contract

\`\`\`json
{
  "reportDate": "YYYY-MM-DD",
  "timezone": "Asia/Yangon",
  "items": [
    {
      "fixtureId": "fc-YYYYMMDD-01",
      "home": "Canonical home name",
      "away": "Canonical away name",
      "score": "2-1",
      "sourceName": "Publisher",
      "sourceUrl": "https://...",
      "sourceDate": "YYYY-MM-DD"
    }
  ]
}
\`\`\`

The browser also accepts \`match.tipPredictions.vipInternet\` with \`score\`, \`sourceUrl\`, \`sourceDate\`, \`sourceName\`. Only use with a verifiable publication. On daily publishing, search/update sources *and* date-scoped file atomically with the odds/fixtures publication. Current static JS is not an internet-crawling backend; the rule governs the daily publishing workflow, not an automatic promise that a scraper checked every game. Expose gaps transparently.

### Layout & downloads

The main-only score grid, single PNG and AI bulk PNG must all use the same \`FutureCodeTipScores.predict(match)\` array and headings \`VIP Internet\`, \`Bookies\`, \`AI Tips\`. Main Frame Editor uses the same image renderer for exported AI posters and can filter all sections. Each section uses its own pagination in mixed-section ZIPs. Leave brand mirrors alone.
