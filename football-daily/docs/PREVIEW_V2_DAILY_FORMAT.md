# PREVIEW V2 — PERMANENT DAILY FORMAT (v2.1)

**Approved:** 2026-11-01 (Asia/Yangon). **Source of truth:** `football-daily/config/preview-v2-format.json`. This file and automated tests define the current user-approved layout, superseding older Preview V2 screenshot experiments. Do not change the static site runtime or replace the active branch with old main.

## Daily editorial workflow

For **every eligible fixture**, take that day's approved full `dailyPreviewText` as the factual/source basis, then **write an original natural, concise Burmese editorial** (not first N sentences). Preserve both teams' real strengths and weaknesses, verified facts, and the precise source-approved recommendation. No fabricated player/injury/odds details or exact-score promises. Write ONE flowing, professional Burmese paragraph with **four meaningful sentences** in `previewV2Summary`: (1) the home club's single most important current strength or concern with grounded detail; (2) the away club's single most important strength or concern; (3) the decisive matchup-specific reason after comparing those two factors; and (4) the exact approved team selection ending with `ကို ရွေးချယ်ပါတယ်။`. No generic filler, mechanical trimming, or two-sentence micro summaries. Keep the summary approximately 300–760 Myanmar Unicode characters, with legible typography on the website and in PNG exports. Use the exact Myanmar club spellings from today's PDF, and never reuse old-date content. Store `previewV2Selection` as one of the exact `homeDisplay`/`awayDisplay` values, and match the original prose ending.

Required per-match fields (add to existing `data/today.json`, do not replace other data):

```json
{
  "previewV2FormatVersion": "2.1",
  "previewV2Summary": "Write the verified, fluent Burmese paragraph here.",
  "previewV2Selection": "Exact source Myanmar team name",
  "previewV2EditorialDate": "YYYY-MM-DD",
  "previewV2SourcePreviewDate": "YYYY-MM-DD",
  "previewV2EditorialStatus": "reviewed (who/when and source)"
}
```

Both dates **must equal** `reportDate`. Only fill `previewV2Media` when a real sourced photograph exists with URL, source URL, author, caption, licence and archive-context disclosure; otherwise show both team crests with the fallback. No synthetic match photographs.

## One approved match card

1. League + correct local kickoff (12-hour AM/PM).
2. Relevant verified photo (or genuine team crests), both teams' Myanmar names.
3. Medium-length, four-sentence journalist paragraph: one key fact per team, the critical head-to-head explanation, and the chosen team. Preserve the complete original article.
4. Selection with the exact source-approved team.
5. Compact Myanmar odds ribbon in order: home crest/name → goal total → time → body handicap → away name/crest. Morning and independently sourced current odds are separate, current unavailable = visibly unavailable.

Myanmar text uses locally bundled `FCMyanmar` (Noto Sans Myanmar) and Unicode-safe word wrapping, never arbitrary character slicing. Respect the selected frame theme colour. No stretched logos, overlapping letters or clipped paragraphs.

## One banner pair per exported PNG

- 1 match: unframed card → wrap once.
- **2 matches:** render two unframed cards → stack two → **wrap once**.
- **3 matches:** render three unframed cards → stack three → **wrap once**.
- ZIP groups follow the same rule on **each combined PNG**.
- No repeated top/bottom banners in the middle. Preserve correct original proportions, safe padding, frame/editor settings, ZIP folder names, team crest fidelity.
- Card height stays 850 px and the gap stays 12 px; 3-match PNG height minus 2-match PNG height must be **862 px** for the same frame. The Myanmar text renderer must fit the entire four-sentence paragraph by measured word wrapping and never silently cut off lines.

## Publication QA / blocking gates

Run `node football-daily/scripts/validate_preview_v2.cjs football-daily/data/today.json`; failures forbid COMPLETE. Run `node --test football-daily/tests/preview-v2-daily-contract.test.cjs`, and all existing Football Daily tests. On GitHub, the `football-daily-tests.yml` workflow runs daily-data checks and the browser workflow also reruns whenever Preview V2 data changes. Browser acceptance must use the **actual dynamic daily fixture count**, download real 2-match/3-match PNGs, verify font/spacing, compare editor PNG dimensions, inspect ZIP, and read back Cloudflare live resources.

The validator checks schema/provenance/consistency, **not** the truth of external sources. Photo licence and factual journalism quality still require an editorial human review. If coverage or browser QA is unverified, report PARTIAL with exact missing fields, not COMPLETE.

## Source and implementation locations

- `data/today.json` — daily editorial + source mapping
- `main-preview-v2.js` + `main-preview-v2.css` — main UI and per-card render
- `frame-export-engine.js` + `frame-workspace.js` — branded 2/3 match download and ZIP
- `config/preview-v2-format.json` — durable format parameters
- `scripts/validate_preview_v2.cjs`, `tests/preview-v2-daily-contract.test.cjs` — daily validation
- `.github/workflows/preview-v2-live-qa.yml` — browser, PNG/ZIP acceptance on actual live site
