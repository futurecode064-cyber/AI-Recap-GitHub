# Main Football Website: permanent V1/V2 layouts — 2026-11-10

Owner-directed contract (future publication days). Scope: **main channel only**, not BCF/Goal Zone/YKZ/BW/KMM/Ko Thet mirror design changes.

## Layouts and source-of-truth

- **ပွဲကြိုသုံးသပ်ချက် V1**: show exact `ရွေးချယ်မှု - [အသင်း]` below the original full Burmese analysis, and in per-match/batch PNG. `main-editorial-choice.js` is a single shared source for the selected team and text. Use source `previewV2Selection` when it matches exactly one `homeDisplay`/`awayDisplay`; only parse explicit closing team choice if no sourced field exists. If unresolved, show `အတည်မပြုရသေး`. Never guess.
- **ပွဲကြိုသုံးသပ်ချက် V2**: preserve `main-preview-v2.js`'s original on-screen and PNG selection, original content, Myanmar font shaping, league crests and body/goal Myanmar prices. V1 selection must agree with V2 selection (same published record).
- **ဂိုးရလဒ် Version 2**: dedicated `#fcResultsV2` tab, `main-results-v2.js`. Read the original archived fixture and Burmese prose for the selected editorial date in Asia/Yangon, show the **verified actual FT** score above that exact preview, and show original selected club below it. On-screen and in PNG, circle the final score and selected club in red for visual comparison. Require `status === "finished"` and actual `finalScore` as `N-N`; do not present predicted scores as actual results. Do not automatically mark an Asian Handicap pick as winning based only on FT—original body line/market and settlement rules would be needed. Unknown selection must remain explicit as pending.
- **ပေါက်ကြေး Version 2**: `/odds.html#fcOddsV2` runs `main-odds-v2.js` with a league-grouped, **compact 900px logo-free** eight-column table (team names combined as `အိမ်ရှင် နှင့် ဧည့်သည်`), 18–19px readable values, and the same data on-screen and in PNG. A selected built-in or custom colour theme is applied to both the visible table and the downloaded image. Show kickoff, two clubs, upper team, body original/current, goal-total original/current, owner's PDF internet-prediction column. Do not mix VIP Internet / Bookies / AI Tips with the PDF forecast or invent missing current odds. One-image and two-part downloads respect the selected league.
- **Top/bottom banners**: Screenshot branding such as BCF is FORMAT REFERENCE ONLY, not a default asset or authorized banner. The new results/odds V2 screens allow owner-selected image uploads per browser session; optional, not persistent. To make banner settings persistent for future visitors, implement a separately approved saved Frame Editor integration, not a fixed BCF watermark.
- **Every following day**: Generate layouts from the chosen date's publication and available original records, do not hard-code teams, odds, branding, final scores, or dates. Preserve original V1/V2, AI and News sections, all clone styling and downloads, and the live main URL.

## Production paths and safety

Cloudflare Pages: https://future-code-football-daily.pages.dev/
Active production mirror source used for these edits: `futurecode064-cyber/AI-Recap-GitHub:football-daily-render`.
The standalone `futurecode064-cyber/future-code-football-daily:main` was behind live as checked 2026-11-10; **do not overwrite this production branch with the older standalone snapshot**. Reconcile both branches deliberately, preserving new main V2 files and all live data before the next attempted source synchronization.

Important QA: Check actual browser rendering, current published archive availability, image encoding and logo-free odds table for any live release. As of 2026-11-10, 2026-11-09 archived fixtures were still `scheduled`, so results V2 correctly cannot display verified FT until that publication is updated. Legacy website CI had **55 failing tests before these edits** (2026-11-09), and the first post-change CI also had 55; no claim of full green suite. Verify live assets separately from GitHub writes.
