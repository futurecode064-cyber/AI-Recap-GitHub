# Future Code Football Daily — Standalone Repository (Cutover Staging)

This repository contains ONLY the Football Daily project, its original YKZ FAMILY GROUP branded clone, original designs, PNG download scripts, tests and daily data. All football application files remain in `football-daily/`; the Cloudflare Pages build output path stays **football-daily** so the URLs remain `/`, `/odds.html`, and `/ykz-family/`.

## Critical production safety
**DO NOT disconnect or delete the original GitHub source or change the Cloudflare Pages project until a new repository and preview are verified.** Current production source is [AI-Recap-GitHub](https://github.com/futurecode064-cyber/AI-Recap-GitHub), production branch `football-daily-render`. Original Pages project: `future-code-football-daily` and hostname https://future-code-football-daily.pages.dev/.

## New repository target
Proposed name: `futurecode064-cyber/future-code-football-daily`, default branch `main`. This staging copy can be used as the source for that new repo; it includes ONLY `.github/workflows/football-daily-tests.yml`, `football-daily/` and this README. Do not copy Android apps or the old unrelated workflows.

## Verification and safe cutover
1. Create a NEW GitHub repository under `futurecode064-cyber` (do not rename/delete old).
2. Push/import this standalone staging tree to `main` of the new repo, preserving all binary logos and all files.
3. Verify `node --test football-daily/tests/*.test.cjs` and `python football-daily/scripts/daily_guard.py audit` on the new repo; confirm real source JSON, odds, result cards and YKZ logo.
4. Create a temporary SEPARATE Cloudflare Pages preview project using new repo main (build command empty for static site; output directory `football-daily`). Ensure its `/`, `/odds.html`, `/ykz-family/`, `/ykz-family/odds.html`, data JSON endpoints and PNG downloads all work.
5. Only after that, cut over the existing Pages project (if Cloudflare supports safe repository change), or move the domain with a controlled DNS/Pages migration. Do not leave production `future-code-football-daily.pages.dev` disconnected. If Cloudflare cannot change the repository on an existing Pages project, retaining the original Pages project is safer than moving and losing the hostname; use the new repo as the separate development and backup source until a controlled hostname strategy is approved.
6. Update all daily AI publisher instructions from `AI-Recap-GitHub:football-daily-render` to `future-code-football-daily:main` only AFTER the new Pages production workflow has been validated. Preserve 6AM research-only and manual publish after approval.

Daily authoritative format: `football-daily/DAILY_APPROVED_FORMAT.md`. Multi-brand guidance: `football-daily/BRAND_SITES.md`.

Source snapshot SHA: `d21dae40e6805cd0300999fdd810987364ff8ee1` as checked during staging.
