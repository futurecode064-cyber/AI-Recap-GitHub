# Future Code Football Daily — API-key-free publishing runbook

Source of truth: `football-daily/RESEARCH_STANDARD.md`.

## Production
- Site: https://future-code-football-daily.pages.dev/
- Repository: futurecode064-cyber/AI-Recap-GitHub
- Deploy branch: `football-daily-render`; deploy directory: `football-daily`.
- Daily report: `football-daily/data/today.json`.
- Prior dates: `football-daily/data/archive/YYYY-MM-DD.json`.
- Tomorrow: `football-daily/data/upcoming/YYYY-MM-DD.json` when genuinely verified.
- All report dates are Asia/Yangon dates, not GitHub UTC dates.

## No Football API key / no AI API key
The publisher is a ChatGPT scheduled task at 06:00 Asia/Yangon, using
publicly accessible source pages and the connected GitHub app. It must
research *fresh* fixtures and standings, write the Burmese editorial
articles, and update the report in GitHub. This is NOT a GitHub Actions
AI job: GitHub Actions alone does not have a language model and must
not fabricate previews or odds. Scheduled-task access to GitHub
writes must be verified on an actual run; task enabled != published.

## Daily publishing contract
1. Read `RESEARCH_STANDARD.md` and live `today.json`.
2. Verify all target-league fixtures for the correct Yangon calendar date.
3. Independently verify BOTH teams' standings and relevant form/news;
   never substitute fabricated missing numbers.
4. Research/write fluent Burmese `dailyPreviewText`, with exact JSON
   keys and quality rules in `RESEARCH_STANDARD.md`.
5. Preserve any same-date user-entered Myanmar-market odds verbatim;
   do not invent or auto-fetch these odds.
6. Preserve yesterday's published report before rollover and never
   overwrite an archive's newer confirmed results.
7. Fetch GitHub file SHA, update only `football-daily-render`, and read
   back the committed JSON.
8. `python football-daily/scripts/daily_guard.py audit` must pass
   (schema/freshness only; *not* an external fact verification).
9. Verify live Pages JSON when reachable. GitHub commit success
   does not prove Cloudflare deployment.
10. If permission, source verification or deployment fails, explicitly
    report the issue; never claim publication.

## Independent score sync
The existing workflow `.github/workflows/football-daily-live-sync.yml`
(on the GitHub default branch `main`) updates verified ESPN scores
and H2H on the production branch every 15 minutes by schedule.
It only enriches already published matches. It does not create
fixtures or write new analysis. Do not add a duplicate score-sync job.

## Publication health
The separate scheduled `football-daily-publish-audit.yml` workflow
(on `main`) checks report freshness/schema and site navigation tests
after the expected daily publish time. A failed audit signals missing
or invalid website data, not an automatic retry of editorial content.

## Troubleshooting
- `published:false` and empty `matches`: no report has been published.
- Missing report date: site intentionally hides stale data.
- GitHub write blocked: investigate GitHub app's authenticated rights
  and the actual failed task run; do not overwrite unverified content.
- Missing odds, H2H or lineups: display blanks; do not invent values.
- If today's actual target-league fixtures are all independently verified
  as absent, only then use `published:true`, `matches:[]` and all
  target leagues in `noFixturesLeagues`.
