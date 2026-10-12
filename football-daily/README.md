> **CURRENT APPROVED STANDARD (2026-10-12):** Read [DAILY_APPROVED_FORMAT.md](./DAILY_APPROVED_FORMAT.md) FIRST before preparing, uploading or redesigning any daily reports, odds tables or downloadable PNGs. That document supersedes older examples below, including automatic 06:00 publishing, tomorrow tab and DOM screenshot exports. Daily 06:00 task prepares only; USER explicitly approves each GitHub publish.

# Cloudflare Pages Free deployment (recommended)

The site is ready for Cloudflare Pages Git integration. It has a top-level `index.html` inside `football-daily/` and a `_headers` file for daily JSON freshness.

Go to https://dash.cloudflare.com/ → **Workers & Pages** → **Create application** → **Pages** → **Import an existing Git repository** / **Connect to Git**. Connect GitHub and select repo `futurecode064-cyber/AI-Recap-GitHub`. Use:

| Setting | Value |
|---|---|
| Project name | `future-code-football-daily` (or another available name) |
| Production branch | `football-daily-render` |
| Framework preset | `None` |
| Build command | `exit 0` |
| Build output directory | `football-daily` |
| Root directory (if asked) | repository root / `/` |
| Environment variables | none |
| Plan | Cloudflare Free |

Then **Save and Deploy**. Cloudflare gives the *actual* deployed `*.pages.dev` URL once the project is created; do not guess this address before deployment. Test from Myanmar without VPN on several ISPs; availability is not guaranteed by choice of host. If the production branch picker chooses `main` by default, manually select `football-daily-render`. Pages Git integration auto-redeploys on subsequent GitHub pushes.

Sources: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/ and https://developers.cloudflare.com/pages/configuration/git-integration/.

# Future Code Football — independent static website

This website lives under `football-daily/` on the dedicated `football-daily-render` branch. It does **not** run on Floot.

## Deploy to Render (Free Static Site)

1. In the existing Render workspace choose **New → Static Site**.
2. Connect the existing public GitHub repository `futurecode064-cyber/AI-Recap-GitHub`.
3. Use **Branch:** `football-daily-render`.
4. Use **Build command:** `echo "Static content ready"`.
5. Use **Publish directory:** `football-daily`.
6. Choose an available `onrender.com` domain, publish, and then test it *without VPN* on multiple Myanmar mobile networks. Availability varies by ISP.
7. Render redeploys when the connected branch updates. Other repository branches are untouched.

## Daily report schema

Replace `football-daily/data/today.json` every day before 6 AM Yangon time using the ChatGPT scheduled task + GitHub connector, or upload/update the JSON manually.

```json
{
  "reportDate": "YYYY-MM-DD",
  "published": true,
  "matches": [
    {
      "league": "Premier League",
      "home": "Liverpool",
      "away": "Manchester City",
      "kickoffYangon": "23:00 · 11 Oct",
      "venue": "Anfield",
      "homePlayerName": "Confirmed key player name",
      "homePlayerImage": "https://...",
      "awayPlayerName": "Confirmed key player name",
      "awayPlayerImage": "https://...",
      "homeOdds": "LIVE Myanmar market price if verified",
      "awayOdds": "LIVE Myanmar market price if verified",
      "goalLine": "LIVE total O/U line if verified",
      "marketUpdatedAt": "HH:MM MMT",
      "analysisParagraphs": ["Detailed Burmese analysis paragraph 1", "paragraph 2", "paragraph 3"],
      "verdict": "Reasoned selection or avoid recommendation",
      "asianHandicap": "Verified line or omit",
      "predictedScore": "Optional estimate",
      "specialChoice": false,
      "selectionConfidence": "Optional qualitative confidence"
    }
  ],
  "noFixturesLeagues": []
}
```

### Important publishing behavior

The browser uses `Asia/Yangon` today as its date. Any JSON where `reportDate` does not exactly equal today's `YYYY-MM-DD` is **hidden**, so yesterday's matches never appear. Query `?demo=1` is an explicitly labeled design preview only. Its Liverpool v Man City example is **not** a current fixture or a real betting quote.

### Editorial standards

- Include only verified fixtures, and never invent present-day Myanmar bookmaker odds or handicap values.
- A Special Choice entry is conditional on genuine multi-factor analysis (form, tactics, injuries, line value); it is okay to have zero choices.
- Player images should be licensed appropriately with attribution tracked by the publisher.
- The public match cards omit source lists, checked-time footers and disclaimer paragraphs by user preference, but fact-checking and sources remain essential to generating the underlying report.
- 06:00 publishing cannot be guaranteed until the connected ChatGPT task or another scheduler actually updates this GitHub JSON. Rendering a fixed page does not automatically generate new analyses.
- No API keys or paid services are embedded in this site.

## Work maintenance — 2026-10-11

Continue this existing project in ChatGPT Work using `futurecode064-cyber/AI-Recap-GitHub`, branch `football-daily-render`, directory `football-daily/`. The existing production address is https://future-code-football-daily.pages.dev/; retain its Cloudflare Pages Git integration and branding.

- Main and `/myanmar-football/` pages share scripts and the same data directory.
- Today reads `data/today.json`; yesterday reads `data/archive/YYYY-MM-DD.json`; tomorrow reads `data/upcoming/YYYY-MM-DD.json`, using Asia/Yangon dates.
- Reports require `published: true`, matching `reportDate`, and a `matches` array. Yesterday displays only `status: "finished"` with a valid `finalScore`; predictions are never substituted for final results.
- Daily rollover preserves a prior published report in the archive if absent, and never overwrites a results-enriched archive. Archiving previews does not verify match results.
- H2H / last-five panels need verified `headToHead`, `homeLastFive`, and `awayLastFive` records. Existing missing-data labels are intentional. Do not fabricate them.
- Keep user-provided Myanmar odds verbatim and public odds sources hidden. Preserve flowing Burmese preview prose and the separate Special Choice analysis.
- PNG exports support full article, square, 4:5 feed, and 9:16 story. Fixed-size exports summarize long articles.
- Run `node --test football-daily/tests/navigation.test.cjs` and `python football-daily/scripts/daily_guard.py audit` before updates. The latter checks schema/freshness, not independent sports fact accuracy.
- A daily 06:00 MMT publishing promise requires a working external scheduler; this static site itself does not research or publish new reports.

Removed failure modes: out-of-order request errors overwriting the current date, same-date refresh races, branded-page startup failure, incorrect branded archive paths, missing branded social-export script, unpublished data rendering, and destructive unarchived rollover.
  

## 2026-10-12 UI and scheduled-research update
The current site supports only **YESTERDAY / TODAY** tabs, no TOMORROW tab. Competition filters are generated from the matches in the currently selected published report (both normal and fixture-snapshot reports), not from a permanent list. Empty competitions and the no-fixture league list are hidden. This preserves separate previous-day verified FT results, ordinary Burmese preview text, 1X2, Myanmar odds, form/H2H, Special Choice and PNG export.

Approved competitions: Premier League, Championship, League One, La Liga, La Liga 2, Serie A, Serie B, Bundesliga, 2. Bundesliga, Ligue 1, Ligue 2, FA Cup, EFL Cup, Coppa Italia, Copa del Rey, DFB-Pokal, Coupe de France, UEFA Champions League, UEFA Europa League, UEFA Conference League, UEFA Nations League, FIFA World Cup, FIFA World Cup Qualifying, UEFA Euro, UEFA Euro Qualifying.

IMPORTANT: the daily 06:00 Asia/Yangon ChatGPT Task is **research / JSON preparation only**. It must not commit or publish to GitHub; publishing happens only on a fresh explicit user instruction. The public website is not an AI-model runtime and needs a published JSON. Read RESEARCH_STANDARD.md's latest section for the 25-competition editorial rules. ESPN public scoreboard sync, AiScore/LiveScore available source pages and official results may enrich verified last-five/H2H; source availability and licensing must be respected.

For Myanmar body/goals odds: keep exact same-day user-supplied prices; a public Myanmar-odds page may be checked but cannot be represented as verified IBET789 quotes without matching current source evidence. No API key required and no invented rates.
