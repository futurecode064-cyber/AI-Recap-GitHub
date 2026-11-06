GOAL ZONE JOURNAL — ENGLISH TRANSLATION MIRROR
Public: https://future-code-football-daily.pages.dev/goal-zone-english/
Original unchanged: https://future-code-football-daily.pages.dev/future-code-journal/

This is NOT a redesigned football website. index.html and odds.html preserve the native Goal Zone Sports Journal DOM hierarchy, section order and CSS. The exact original site's stylesheets, graphics and shared football rendering modules are reused; Goal Zone-only scripts have local English-labelled copies so the Burmese site is not changed. The banner stays the original journal artwork with its wordmark displayed in English.

Same live JSON facts:
  ../data/today.json
  ../data/archive/YYYY-MM-DD.json
  ../data/odds/YYYY-MM-DD.json
  ../data/news/latest.json
  ../data/fixtures/YYYY-MM-DD.json
No separate match database, fabricated results or changed bookmaker lines.

English translation implementation:
  english-data.js is loaded BEFORE shared data/rendering scripts and translates the source report into English on fetch, preserving the fixture IDs, prices, standings, source links and imagery. It holds full journalist-style English dailyPreviewText, previewV2Summary, featured specialAnalysisParagraphs, and English news by exact ID for 2026-11-06 (13 previews / 2 Special Choices / 10 articles).
  english-ui.js translates date tabs, match cards, news labels, odds, probabilities, filters, statuses and other shared dynamic interface text while keeping the original HTML structure intact.
  goal-zone-download-center.js and goal-zone-downloads.js keep the original ZIP/image layout, render English descriptions and overlay the banner wordmark in English.

MANDATORY DAILY EDITORIAL SYNC:
When publishing the Burmese edition for a new reportDate, update the English translations for EACH new fixture ID and news item ID as part of the same invoked editorial publication. Translate the actual Burmese author text; do not substitute a new statistical summary or invent unsupported claims. Preserve each Special Choice selection and its full analysis. Do NOT silently show stale translations from an older date; the English mirror currently uses an explicit honest translation-pending fallback for untranslated new articles. English parity is only fully editorially complete after adding today's translations and verifying them.

VERIFY:
- Original and English sites have the same match count, news count and seven section links.
- They use the same data version/reportDate and all real crests/scores/odds.
- Every headline, preview and selected pick is in English in the English version.
- Both odds.html pages retain the same table, filters, controls and PNG behaviour.
- The original Myanmar website stays unmodified.
- Run .github/workflows/goal-zone-english-parity-qa.yml and manually inspect the English graphic and ZIP downloads.

The public English URL is a standalone route under the existing Cloudflare Pages domain. It is not currently a separate custom hostname.
