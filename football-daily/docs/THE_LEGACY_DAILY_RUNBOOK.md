# THE LEGACY | ဘောလုံးသမိုင်း — Daily Editorial Contract
Created 2026-11-07 for the EXISTING Main + Goal Zone sites ONLY.
Routes: /legacy/ and /future-code-journal/legacy/. Other brands unaffected.
Source of truth: football-daily/data/legacy/index.json and articles/YYYY-MM-DD-slug.json.
Designs are independent brand presentations using legacy-ui.js and legacy-ui.css.
Do not mix with existing latest.json, today.json, preview, odds, news or AI tabs.
Daily local publication date uses Asia/Yangon. A new topic gets a new unique ID, filename and entry in index.json; NEVER replace a previous day's JSON when writing a new article.
Append new metadata to index.json, newest first by date via client sort. Keep prior entries and assets available; no overwrite during daily rollover. Verify exact date, title and category filtering, article full-text, text/plain .TXT BOM Myanmar encoding, cover PNG and chapter PNG downloads.
On each fresh publication: research credible official and trusted historical sources; author journalist-style Myanmar prose, no stiff textbook endings, no invented facts; retain source urls, event date vs publication date, license/provenance for every photograph. For imagery use appropriately licensed photos or owned original assets; clearly label historical photos as such (never pretend a historic image depicts a current event). Main theme slate/cyan; Goal Zone theme black/gold/red; preserve existing homepages and other sections.
Categories: ကစားသမားသမိုင်း | အသင်းသမိုင်း | သမိုင်းဝင်ပွဲစဉ် | ဒဏ္ဍာရီနှင့် အမွေအနှစ်.
Reader assets: shared index.json + article JSON; downloadable cover and one per chapter are generated client-side from licensed photo via Canvas, with visual fallback if photo is unavailable. Verify actual browser PNG, not just script presence.
A separate enabled daily ChatGPT automation titled THE LEGACY နေ့စဉ်ဆောင်းပါး was created on 2026-11-07 to research and attempt one new daily entry. Its existence does NOT prove each future entry will publish; every run must verify connected publishing access, live pages and actual downloads, and accurately report any blocker. Never treat this automation as a hard-coded GitHub Actions generator.
Production: futurecode064-cyber/AI-Recap-GitHub branch football-daily-render, folder football-daily. Preserve all concurrent content.
