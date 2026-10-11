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
